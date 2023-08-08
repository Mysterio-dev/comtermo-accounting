import { useState, useEffect } from "react";
import {
  Calendar,
  Modal,
  Input,
  Badge,
  message,
  notification,
  Table,
  Button,
  ConfigProvider,
  Popconfirm,
  Tag,
  Layout,
  Typography,
} from "antd";
import { getAuth, signOut } from "firebase/auth";
const { Header, Footer, Content } = Layout; // Деструктурируйте компоненты Layout
const { Text } = Typography;
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Col, Row } from "antd";
import moment from "moment";
import "moment/locale/ru";
import ruRU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import logoImage from "../assets/logo.png";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMENFkqkVFAMWpxLSFWsGB2AWsGiPbG5s",
  authDomain: "comtermo-calendar.firebaseapp.com",
  projectId: "comtermo-calendar",
  storageBucket: "comtermo-calendar.appspot.com",
  messagingSenderId: "645495264257",
  appId: "1:645495264257:web:cc88185130b4b4777a1c00",
  measurementId: "G-PQ6DC10E55",
};

// Инициализация Firebase приложения
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {

  // Получаем текущий год
  const currentYear = new Date().getFullYear();

  // Здесь происходит локализация библиотек момент и dayjs на русский язык.
  dayjs.locale("ru");

  // Задаются колонки для таблицы.
  const columns = [
    {
      title: "",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Дата взятия",
      dataIndex: "tableStart",
      sorter: (a, b) =>
        moment(a.tableStart).unix() - moment(b.tableStart).unix(),
      render: (text) => (
        <div className="tableValue">
          <MinusCircleOutlined style={{ marginRight: 8, color: "#02aaff" }} />
          {text}
        </div>
      ),
    },
    {
      title: "Дата погашения",
      dataIndex: "tableEnd",
      sorter: (a, b) => moment(a.tableEnd).unix() - moment(b.tableEnd).unix(),
      render: (text) => (
        <div className="tableValue">
          <PlusCircleOutlined style={{ marginRight: 8, color: 'rgb(255 95 97)' }} />
          {text}
        </div>
      ),
    },
    {
      title: "Текст",
      dataIndex: "tableContent",
    },
    {
      title: "Действие",
      dataIndex: "tableControl",
      render: (_, record) => (
        <Popconfirm
          title="Вы действительно хотите удалить эту запись?"
          onConfirm={() => handleDelete(record.eventId)}
          okText="Да"
          cancelText="Отмена"
        >
          <Button type="primary" size="small" danger>
            Удалить
          </Button>
        </Popconfirm>
      ),
    },
  ];
  
  // Определение массива фиксированных цветов
  const colors = [
    "#3399FF",
    "#00CC00",
    "#9933FF",
    "#FF3333",
    "#FFFF33",
    "#99CCFF",
    "#FF8000",
    "#33FFFF",
    "#4C0099",
    "#FFCCFF",
    "#FFE5CC",
    "#99004C",
  ];

  // Функция getColorByIndex: Возвращает цвет на основе индекса в массиве цветов.
  const getColorByIndex = (index) => {
    return colors[index % colors.length];
  };

  // Обработчик изменения панели календаря (onPanelChange): Если выбранная дата находится в другом месяце, сбрасывает выбранную дату и скрывает модальное окно.
  const onPanelChange = (value, mode) => {
    if (selectedDate) {
      const currentDate = selectedDate.format("YYYY-MM");
      const panelDate = value.format("YYYY-MM");

      if (currentDate !== panelDate) {
        setSelectedDate(null);
        setIsModalVisible(false);
      }
    }
    setCurrentMonth(value.month());
  };

  const onSelect = (value) => {
    if (value && value.isValid()) {
      setSelectedDate(value);
      setIsModalVisible(value.month() === currentMonth);

      if (value.month() !== currentMonth) {
        // Если выбранная дата не принадлежит текущему месяцу, сбрасываем выделение в таблице
        setSelectedRowKeys([]);
      } else {
        // Получаем дату в формате YYYY-MM-DD
        const date = value.format("YYYY-MM-DD");
        // Получаем события для выбранной даты
        const events = calendarData[date] || [];
        // Получаем eventId'ы для выделения строк в таблице
        const selectedRowKeys = events.map(
          (event) =>
            tableData.find((item) => item.tableContent === event)?.eventId
        );
        // Устанавливаем состояние selectedRowKeys, чтобы выделить соответствующие записи в таблице
        setSelectedRowKeys(selectedRowKeys);
      }
    }
  };

  // Здесь объявляются состояния для управления выбранной датой, модальным окном, вводимым значением, данными календаря и уведомлениями, а также для управления выделенными строками в таблице.
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [calendarData, setCalendarData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [shownNotifications, setShownNotifications] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleDelete = async (eventId) => {
    try {
      // Получаем событие по eventId
      const event = tableData.find((item) => item.eventId === eventId);
      if (!event) {
        console.error("Событие с указанным eventId не найдено.");
        message.error("Событие не найдено.");
        return;
      }

      const { tableStart, tableEnd } = event;

      // Удаляем документ из коллекции "tableData" по eventId
      await deleteDoc(doc(db, "tableData", eventId));
      console.log("Событие успешно удалено из Firestore");

      // удаляя событие с указанным eventId из массивов событий
      await Promise.all([
        updateDoc(doc(db, "calendarEvents", tableStart), {
          events: getFieldValueWithoutEventId(
            calendarData[tableStart],
            eventId
          ),
        }),
        updateDoc(doc(db, "calendarEvents", tableEnd), {
          events: getFieldValueWithoutEventId(calendarData[tableEnd], eventId),
        }),
      ]);

      console.log("События успешно удалены из Firestore");

      // Обновляем состояние tableData, используя функцию обновления
      setTableData((prevData) =>
        prevData.filter((item) => item.eventId !== eventId)
      );

      // Обновляем состояние selectedRowKeys, чтобы снять выделение удаленных строк в таблице
      setSelectedRowKeys((prevKeys) =>
        prevKeys.filter((key) => key !== eventId)
      );

      // Обновляем состояние calendarData, удаляя удаленные события для выбранных дат
      setCalendarData((prevData) => {
        const newData = { ...prevData };
        newData[tableStart] = getFieldValueWithoutEventId(
          newData[tableStart] || [],
          eventId
        );
        newData[tableEnd] = getFieldValueWithoutEventId(
          newData[tableEnd] || [],
          eventId
        );
        return newData;
      });

      message.success("События успешно удалены!");
    } catch (error) {
      console.error("Ошибка при удалении событий из Firestore:", error);
      message.error("Ошибка при удалении событий из Firestore");
    }
  };

  // Вспомогательная функция для удаления события с заданным eventId из массива событий
  const getFieldValueWithoutEventId = (events, eventId) =>
    events.filter((event) => event.eventId !== eventId);

  // Функция для загрузки данных календаря и таблицы из Firestore
  // const loadCalendarAndTableData = async () => {
  //   try {
  //     // Загрузка данных календаря из Firestore
  //     const calendarDataRef = collection(db, "calendarEvents");
  //     const calendarDataSnapshot = await getDocs(calendarDataRef);
  //     const newCalendarData = {};
  //     calendarDataSnapshot.forEach((doc) => {
  //       newCalendarData[doc.id] = doc.data().events.map(event => {
  //           return {
  //               ...event,
  //               isCloned: event.isCloned || false
  //           };
  //       });
  //   });

  //     setCalendarData(newCalendarData);

  //     // Загрузка данных таблицы из Firestore
  //     const tableDataRef = collection(db, "tableData");
  //     const tableDataSnapshot = await getDocs(tableDataRef);
  //     const newTableData = [];
  //     tableDataSnapshot.forEach((doc) => {
  //       const { startDate, endDate, content } = doc.data();
  //       newTableData.push({
  //         tableStart: startDate,
  //         tableEnd: endDate,
  //         tableContent: content,
  //         eventId: doc.id,
  //       });
  //     });
  //     setTableData(newTableData);
  //   } catch (error) {
  //     console.error("Ошибка при загрузке данных из Firestore:", error);
  //   }
  // };

  const loadCalendarAndTableData = () => {
    try {
      const calendarDataRef = collection(db, "calendarEvents");
      const tableDataRef = collection(db, "tableData");
  
      // Установка слушателя для событий календаря
      const calendarUnsubscribe = onSnapshot(calendarDataRef, (snapshot) => {
        const newCalendarData = {};
        snapshot.forEach((doc) => {
          newCalendarData[doc.id] = doc.data().events.map((event) => {
            return {
              ...event,
              isCloned: event.isCloned || false,
            };
          });
        });
        setCalendarData(newCalendarData);
      });
  
      // Установка слушателя для данных таблицы
      const tableUnsubscribe = onSnapshot(tableDataRef, (snapshot) => {
        const newTableData = [];
        snapshot.forEach((doc) => {
          const { startDate, endDate, content } = doc.data();
          newTableData.push({
            tableStart: startDate,
            tableEnd: endDate,
            tableContent: content,
            eventId: doc.id,
          });
        });
        setTableData(newTableData);
      });
  
      // Возвращение функций очистки, чтобы отписаться при размонтировании компонента
      return () => {
        calendarUnsubscribe();
        tableUnsubscribe();
      };
    } catch (error) {
      console.error("Ошибка при загрузке данных из Firestore:", error);
    }
  };

  
  const handleModalOk = () => {
    if (inputValue.trim() !== "") {
      const eventId = Date.now().toString();
      const date = selectedDate.format("YYYY-MM-DD");
      const eventsForDate = calendarData[date]
        ? [...calendarData[date], { eventId, content: inputValue }]
        : [{ eventId, content: inputValue }];
      const nextDate = selectedDate.clone().add(30, "days").format("YYYY-MM-DD");
  
      // Записываем данные в Firestore и обрабатываем успешное выполнение
      Promise.all([
        setDoc(doc(db, "calendarEvents", date), { events: eventsForDate }),
        setDoc(doc(db, "calendarEvents", nextDate), { 
          events: eventsForDate.map(event => {
              return { ...event, isCloned: true };
          }) 
      }),
      
        setDoc(doc(db, "tableData", eventId), {
          startDate: date,
          endDate: nextDate,
          content: inputValue,
        }),
      ])
        .then(() => {
          console.log("Данные успешно записаны в Firestore");
          // Записываем уведомление о начале события
          addNotificationToFirestore(eventId, inputValue, date, true);
        })
        .catch((error) => {
          console.error("Ошибка при записи данных в Firestore:", error);
          message.error("Ошибка при записи данных в Firestore");
        });
  
        setCalendarData((prevData) => ({
          ...prevData,
          [date]: [...(prevData[date] || []), { eventId, content: inputValue }],
          [nextDate]: [
            ...(prevData[nextDate] || []),
            { eventId, content: inputValue, isCloned: true }, // Установите isCloned в true при клонировании
          ],
        }));
        
  
      setTableData((prevData) => [
        ...prevData,
        {
          tableStart: date,
          tableEnd: nextDate,
          tableContent: inputValue,
          eventId, // Используем один и тот же идентификатор для события в таблице
         
        },
      ]);
      message.success("Данные успешно добавлены!");
    }
    setInputValue("");
    setIsModalVisible(false);
  };
  
  // Обработчик закрытия модального окна (handleModalCancel): Очищает поле ввода и скрывает модальное окно.
  const handleModalCancel = () => {
    setInputValue("");
    setIsModalVisible(false);
  };

  // Обработчик изменения значения в поле ввода (handleInputChange).
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const cellRender = (value) => {
    const date = value.format("YYYY-MM-DD");
    const events = calendarData[date];
    return (
      <div>
        {events && events.length > 0 ? (
          <ul className="events">
            {events.map((event, index) => (
              <li key={index}>
                {event.isCloned ? (
                  <PlusCircleOutlined style={{ color: 'rgb(255 95 97)', marginRight: 8 }} /> // Иконка плюса для клонированного события
                ) : (
                  <MinusCircleOutlined style={{ color: "#02aaff", marginRight: 8 }} />
                )}
                <span>{event.content}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  };
  
<<<<<<< HEAD
//   useEffect(() => {
//     // Получаем текущую дату
//     const currentDate = moment();
//     // Устанавливаем месяц текущей даты в состояние currentMonth
//     setCurrentMonth(currentDate.month());

//     // Функция для загрузки данных календаря и таблицы из Firestore
//     const loadCalendarAndTableData = async () => {
//       try {
//         // Загрузка данных календаря из Firestore
//         const calendarDataRef = collection(db, "calendarEvents");
//         const calendarDataSnapshot = await getDocs(calendarDataRef);
//         const newCalendarData = {};
=======
  
  useEffect(() => {
    // Получаем текущую дату
    const currentDate = moment();
    // Устанавливаем месяц текущей даты в состояние currentMonth
    setCurrentMonth(currentDate.month());

    // Функция для загрузки данных календаря и таблицы из Firestore
    const loadCalendarAndTableData = async () => {
      try {
        // Загрузка данных календаря из Firestore
        const calendarDataRef = collection(db, "calendarEvents");
        const calendarDataSnapshot = await getDocs(calendarDataRef);
        const newCalendarData = {};

calendarDataSnapshot.forEach((doc) => {
    // Для каждого события в doc.data().events проверьте наличие флага isCloned
    // и установите его в соответствующем состоянии.
    newCalendarData[doc.id] = doc.data().events.map(event => {
        return {
            ...event,
            isCloned: event.isCloned || false // Установите значение по умолчанию в false, если флаг isCloned отсутствует
        };
    });
});
setCalendarData(newCalendarData);
>>>>>>> f774a913da39b51d88cff7507ed03ca15458acc1

// calendarDataSnapshot.forEach((doc) => {
//     // Для каждого события в doc.data().events проверьте наличие флага isCloned
//     // и установите его в соответствующем состоянии.
//     newCalendarData[doc.id] = doc.data().events.map(event => {
//         return {
//             ...event,
//             isCloned: event.isCloned || false // Установите значение по умолчанию в false, если флаг isCloned отсутствует
//         };
//     });
// });
// setCalendarData(newCalendarData);

//         // Загрузка данных таблицы из Firestore
//         const tableDataRef = collection(db, "tableData");
//         const tableDataSnapshot = await getDocs(tableDataRef);
//         const newTableData = [];
//         tableDataSnapshot.forEach((doc) => {
//           const { startDate, endDate, content } = doc.data();
//           newTableData.push({
//             tableStart: startDate,
//             tableEnd: endDate,
//             tableContent: content,
//             eventId: doc.id,
//           });
//         });
//         setTableData(newTableData);
//       } catch (error) {
//         console.error("Ошибка при загрузке данных из Firestore:", error);
//       }
//     };

//     loadCalendarAndTableData(); // Загружаем данные при монтировании компонента

//     // Обработка уведомлений в зависимости от tableData
//     tableData.forEach((event) => {
//       const endDate = moment(event.tableEnd);
//       const currentDate = moment();

//       // Уведомление в течение 7 дней до окончания события и только если не показано ранее
//       if (
//         endDate.diff(currentDate, "days") >= 0 &&
//         endDate.diff(currentDate, "days") <= 7 &&
//         !shownNotifications.includes(event.eventId)
//       ) {
//         showNotification(event.tableContent, event.tableEnd, true);
//         setShownNotifications((prevNotifications) => [
//           ...prevNotifications,
//           event.eventId,
//         ]);
//       }
//     });
//   }, []);

useEffect(() => {
  const currentDate = moment();
  setCurrentMonth(currentDate.month());

  // Установка слушателя для данных календаря
  const calendarDataRef = collection(db, "calendarEvents");
  const calendarUnsubscribe = onSnapshot(calendarDataRef, (snapshot) => {
    const newCalendarData = {};
    snapshot.forEach((doc) => {
      newCalendarData[doc.id] = doc.data().events.map((event) => {
        return {
          ...event,
          isCloned: event.isCloned || false,
        };
      });
    });
    setCalendarData(newCalendarData);
  });

  // Установка слушателя для данных таблицы
  const tableDataRef = collection(db, "tableData");
  const tableUnsubscribe = onSnapshot(tableDataRef, (snapshot) => {
    const newTableData = [];
    snapshot.forEach((doc) => {
      const { startDate, endDate, content } = doc.data();
      newTableData.push({
        tableStart: startDate,
        tableEnd: endDate,
        tableContent: content,
        eventId: doc.id,
      });
    });
    setTableData(newTableData);

    // Обработка уведомлений в зависимости от новых данных таблицы
    newTableData.forEach((event) => {
      const endDate = moment(event.tableEnd);
      const currentDate = moment();
      if (
        endDate.diff(currentDate, "days") >= 0 &&
        endDate.diff(currentDate, "days") <= 7 &&
        !shownNotifications.includes(event.eventId)
      ) {
        showNotification(event.tableContent, event.tableEnd, true);
        setShownNotifications((prevNotifications) => [
          ...prevNotifications,
          event.eventId,
        ]);
      }
    });
  });

  // Возвращение функций очистки, чтобы отписаться при размонтировании компонента
  return () => {
    calendarUnsubscribe();
    tableUnsubscribe();
  };
}, []);


  // Второй useEffect остается как есть
  useEffect(() => {
    const currentDate = moment();
    tableData.forEach((event) => {
      const endDate = moment(event.tableEnd);
      if (
        endDate.diff(currentDate, "days") >= 0 &&
        endDate.diff(currentDate, "days") <= 7 &&
        !shownNotifications.includes(event.eventId)
      ) {
        showNotification(event.tableContent, event.tableEnd, true);

        setShownNotifications((prevNotifications) => [
          ...prevNotifications,
          event.eventId,
        ]);
      }
    });
  }, [tableData]);

  const addNotificationToFirestore = async (eventId, content, date) => {
    try {
      const endDate = moment(date);
      const currentDate = moment();
      const diffInDays = endDate.diff(currentDate, "days");

      // Записываем уведомление только для событий, которые заканчиваются в течение 7 дней
      if (diffInDays > 0 && diffInDays <= 7) {
        const notificationRef = doc(db, "notifications", `${date}-end`);
        await setDoc(notificationRef, {
          eventId,
          content,
          date,
        });
        console.log("Уведомление успешно записано в Firestore");
      }
    } catch (error) {
      console.error("Ошибка при записи уведомления в Firestore:", error);
    }
  };

  

  const showNotification = (content, date) => {
    const currentDate = moment();
    const targetDate = moment(date);
    const diffInDays = targetDate.diff(currentDate, "days");

    const messagePrefix = "Осталось до окончания";
    const daysString = declOfDays(diffInDays);

    const notificationMessage = `${messagePrefix} ${diffInDays} ${daysString} события "${content}"`;

    notification.warning({
      message: "Предстоящее событие",
      description: notificationMessage,
      duration: 0,
      placement: "topLeft",
    });
  };

  // Вспомогательная функция для склонения слова "день"
  const declOfDays = (days) => {
    const cases = [2, 0, 1, 1, 1, 2];
    const titles = ["день", "дня", "дней"];
    const dayString = days.toString();
    const lastDigit = Number(dayString.slice(-1));

    if (lastDigit === 1) {
      return titles[0]; // "день"
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      return titles[1]; // "дня"
    } else {
      return titles[2]; // "дней"
    }
  };

  return (
    <ConfigProvider locale={ruRU}>
      <Layout style={{ minHeight: "100vh" }}>
        <Header className="header">
          <div className="header__logo">
            <img src={logoImage} alt="Логотип" />
            <h3>
              Comtermo<span> - календарь</span>
            </h3>
          </div>
        </Header>
        <Content className="content">
          <Row>
            <Col span={15} style={{ paddingRight: "10px" }}>
              <div className="сalendar-wrapper">
                <Calendar
                  onPanelChange={onPanelChange}
                  onSelect={onSelect}
                  cellRender={cellRender}
                 
                />
                <Modal
                  title={`Запись на ${selectedDate ? selectedDate.format("DD/MM/YYYY") : ""
                    }`}
                  centered
                  visible={isModalVisible}
                  onOk={handleModalOk}
                  onCancel={handleModalCancel}
                >
                  <Input
                    placeholder="Введите текст"
                    value={inputValue}
                    onChange={handleInputChange}
                  />
                </Modal>
              </div>
            </Col>
            <Col span={9}>
  <div className="table-wrapper">
    <Table
      columns={columns}
      dataSource={tableData.map((item, index) => ({
        ...item,
        key: item.tableStart + index,
      }))}
    />
  </div>
</Col>
          </Row>
        </Content>
        <Footer className="footer">
          <Text>&copy; {currentYear} Comtermo</Text>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
