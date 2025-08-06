import { useState, useEffect } from "react";

import {
  Calendar,
  Modal,
  Input,
  message,
  notification,
  Table,
  Button,
  ConfigProvider,
  Popconfirm,
  Layout,
  Typography,
  theme
} from "antd";


import { Badge } from "antd";
import Circle from '@uiw/react-color-circle';
const { Header, Footer, Content } = Layout; // Деструктурируйте компоненты Layout
const { Text } = Typography;
import {
  MinusCircleOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  DeleteFilled,
  EditTwoTone
} from "@ant-design/icons";
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
  onSnapshot,
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
      title: "Взятия",
      dataIndex: "tableStart",
      sorter: (a, b) => moment(a.tableStart).unix() - moment(b.tableStart).unix(),
      render: (text) => (
        <div className="tableValue">
          <ArrowDownOutlined style={{ marginRight: 5, color: "#FF2400", fontSize: "15px", }} />
          {moment(text).format("DD.MM.YYYY")}
        </div>
      ),
    },
    // {
    //   title: "Погашения",
    //   dataIndex: "tableEnd",
    //   sorter: (a, b) => moment(a.tableEnd).unix() - moment(b.tableEnd).unix(),
    //   render: (text) => (
    //     <div className="tableValue">
    //       <ArrowUpOutlined
    //         style={{ marginRight: 5, color: "#00CC00", fontSize: "15px", }}
    //       />
    //       {moment(text).format("DD.MM.YYYY")}
    //     </div>
    //   ),
    // },
    // {
    //   title: "Погашения",
    //   dataIndex: "tableEnd",
    //   sorter: (a, b) => moment(a.tableEnd).unix() - moment(b.tableEnd).unix(),
    //   render: (text) => {
    //     const isToday = moment(text).isSame(moment(), "day");
    //     return (
    //       <div className="tableValue" style={{ display: "flex", alignItems: "center" }}>
    //         <ArrowUpOutlined
    //           style={{ marginRight: 5, color: "#00CC00", fontSize: "15px", }}
    //         />
    //         <span>{moment(text).format("DD.MM.YYYY")}</span>
    //         {isToday && (
    //           <div className="pulse-animation" style={{ marginLeft: "8px", }}>
    //             <Badge status="error" />
    //           </div>
    //         )}
    //       </div>
    //     );
    //   },
    // },
    {
      title: "Погашения",
      dataIndex: "tableEnd",
      sorter: (a, b) => moment(a.tableEnd).unix() - moment(b.tableEnd).unix(),
      render: (text) => {
        const isToday = moment(text).isSame(moment(), "day"); // Проверка, является ли дата сегодняшней
        const isNearFuture = moment(text).isAfter(moment()) && moment(text).diff(moment(), "days") <= 3; // Проверка, близка ли дата

        return (
          <div className="tableValue" style={{ display: "flex", alignItems: "center" }}>
            <ArrowUpOutlined
              style={{ marginRight: 5, color: "#00CC00", fontSize: "15px" }}
            />
            <span>{moment(text).format("DD.MM.YYYY")}</span>
            {isToday && (
              <div className="pulse-animation" style={{ marginLeft: "8px" }}>
                <Badge status="error" />
              </div>
            )}
            {isNearFuture && (
              <div className="yellow-pulse-animation" style={{ marginLeft: "8px" }}>
                <Badge status="warning" />
              </div>
            )}
          </div>
        );
      },
    },


    {
      title: "Сумма",
      dataIndex: "tableContent",
    },
    {
      title: "Действие",
      dataIndex: "tableControl",
      render: (_, record) => (
        <div className="table-action">
          <Button

            size="small"
            onClick={() => handleEdit(record.eventId, record.tableContent)}
          >
            <EditTwoTone />
          </Button>
          <Popconfirm
            title="Вы действительно хотите удалить эту запись?"
            onConfirm={() => handleDelete(record.eventId)}
            okText="Да"
            cancelText="Отмена"
          >
            <Button
              size="small"
              danger
            >
              <DeleteFilled />
            </Button>
          </Popconfirm>
        </div>
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
    if (mode === "year") {
      setSelectedDate(null); // Сбрасываем выбранную дату
      setIsModalVisible(false); // Закрываем модальное окно
    } else {
      if (selectedDate) {
        const currentDate = selectedDate.format("YYYY-MM");
        const panelDate = value.format("YYYY-MM");

        if (currentDate !== panelDate) {
          setSelectedDate(null); // Сбрасываем выбранную дату
          setIsModalVisible(false); // Закрываем модальное окно
        }
      }
      setCurrentMonth(value.month());
    }
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

  const [editingEventId, setEditingEventId] = useState(null);
  const [editingEventContent, setEditingEventContent] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [eventColor, setEventColor] = useState("rgba(0, 0, 0, 0.88)");
  const [initialColor, setInitialColor] = useState("rgba(0, 0, 0, 0.88)");



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

      message.success("Запись удалена");
    } catch (error) {
      console.error("Ошибка при удалении событий из Firestore:", error);
      message.error("Ошибка при удалении событий из Firestore");
    }
  };

  // Вспомогательная функция для удаления события с заданным eventId из массива событий
  const getFieldValueWithoutEventId = (events, eventId) =>
    events.filter((event) => event.eventId !== eventId);

  const loadCalendarAndTableData = () => {
    try {
      const calendarDataRef = collection(db, "calendarEvents");
      const tableDataRef = collection(db, "tableData");

      // Установка слушателя для событий календаря
      const calendarUnsubscribe = onSnapshot(calendarDataRef, (snapshot) => {
        const newCalendarData = {};
        snapshot.forEach((doc) => {
          const eventsData = doc.data()?.events || []; // Проверка наличия свойства events
          newCalendarData[doc.id] = eventsData.map((event) => {
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

  const handleEdit = (eventId, content) => {
    setEditingEventId(eventId);
    setEditingEventContent(content);
    setEditModalVisible(true);
  };

  const handleEditInputChange = (e) => {
    setEditingEventContent(e.target.value);
  };

  const handleModalOk = () => {
    if (inputValue.trim() !== "") {
      const eventId = Date.now().toString();
      const date = selectedDate.format("YYYY-MM-DD");
      const eventsForDate = calendarData[date]
        ? [...calendarData[date], { eventId, content: inputValue, color: eventColor }]
        : [{ eventId, content: inputValue, color: eventColor }];
      const nextDate = selectedDate
        .clone()
        .add(29, "days")
        .format("YYYY-MM-DD");

      // Записываем данные в Firestore и обрабатываем успешное выполнение
      // Promise.all([
      //   setDoc(doc(db, "calendarEvents", date), { events: eventsForDate }),
      //   setDoc(doc(db, "calendarEvents", nextDate), {
      //     events: eventsForDate.map((event) => {
      //       return { ...event, isCloned: true };
      //     }),
      //   }),

      //   setDoc(doc(db, "tableData", eventId), {
      //     startDate: date,
      //     endDate: nextDate,
      //     content: inputValue,
      //   }),
      // ])
      //   .then(() => {
      //     console.log("Данные успешно записаны в Firestore");
      //     addNotificationToFirestore(eventId, inputValue, date, true);
      //   })
      //   .catch((error) => {
      //     console.error("Ошибка при записи данных в Firestore:", error);
      //     message.error("Ошибка при записи данных в Firestore");
      //   });


      Promise.all([
        setDoc(doc(db, "calendarEvents", date), { events: eventsForDate }),
        setDoc(doc(db, "calendarEvents", nextDate), {
          events: eventsForDate.map((event) => ({ ...event, isCloned: true })),
        }),
        setDoc(doc(db, "tableData", eventId), {
          startDate: date,
          endDate: nextDate,
          content: inputValue,
        }),
      ])
        .then(() => {
          console.log("Данные успешно записаны в Firestore");
          addNotificationToFirestore(eventId, inputValue, date, true);
        })
        .catch((error) => {
          console.error("Ошибка при записи данных в Firestore:", error);
          message.error("Ошибка при записи данных в Firestore");
        });
      message.success("Запись добавлена!");
    }
    setInputValue("");
    setIsModalVisible(false);

    setEventColor(initialColor);
  };

  const findDateByEventId = (data, eventId) => {
    for (let date in data) {
      const events = data[date];
      if (events.some((event) => event.eventId === eventId)) {
        return date;
      }
    }
    return null;
  };

  const handleEditOk = () => {
    if (editingEventContent.trim() !== "") {
      // Определяем дату редактируемого события
      const date = findDateByEventId(calendarData, editingEventId);

      if (!date) {
        console.error("Не удалось определить дату события.");
        message.error("Ошибка при редактировании.");
        return;
      }

      // Получаем список событий для этой даты и обновляем событие с заданным ID
      const updatedEvents = calendarData[date].map((event) =>
        event.eventId === editingEventId
          ? { ...event, content: editingEventContent }
          : event
      );

      // Получаем список событий для следующей даты (через 29 дней)
      const nextDate = moment(date).add(29, "days").format("YYYY-MM-DD");
      const updatedEventsForNextDate = (calendarData[nextDate] || []).map(
        (event) =>
          event.eventId === editingEventId
            ? { ...event, content: editingEventContent }
            : event
      );

      // Обновление данных в Firestore и обрабатываем успешное выполнение
      Promise.all([
        setDoc(doc(db, "calendarEvents", date), { events: updatedEvents }),
        setDoc(doc(db, "calendarEvents", nextDate), {
          events: updatedEventsForNextDate,
        }),
        updateDoc(doc(db, "tableData", editingEventId), {
          content: editingEventContent,
        }),
      ])
        .then(() => {
          console.log("Данные успешно обновлены в Firestore");
        })
        .catch((error) => {
          console.error("Ошибка при обновлении данных в Firestore:", error);
          message.error("Ошибка при обновлении данных в Firestore");
        });

      // Обновление данных в tableData (если требуется)
      const updatedTableData = tableData.map((item) =>
        item.eventId === editingEventId
          ? { ...item, tableContent: editingEventContent }
          : item
      );
      setTableData(updatedTableData);

      // Завершение редактирования
      setEditingEventId(null);
      setEditingEventContent("");
      setEditModalVisible(false);
    } else {
      message.error("Содержимое не может быть пустым");
    }

    // Сброс цвета к начальному
    setEventColor(initialColor);
  };

  // Обработчик закрытия модального окна (handleModalCancel): Очищает поле ввода и скрывает модальное окно.
  const handleModalCancel = () => {
    setEditingEventId(null);
    setEditingEventContent("");
    setIsModalVisible(false);
    setEditModalVisible(false);
  };

  // Обработчик изменения значения в поле ввода (handleInputChange).
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // const cellRender = (value) => {
  //   const date = value.format("YYYY-MM-DD");
  //   const events = calendarData[date];
  //   return (
  //     <div>
  //       {events && events.length > 0 ? (
  //         <ul className="events">
  //           {events.map((event, index) => (
  //              <li key={index} style={{ color: event.color }}>
  //               {event.isCloned ? (
  //                 <PlusCircleOutlined
  //                   style={{ color: "#FF2400", marginRight: 5, fontSize: "11px" }}
  //                 /> // Иконка плюса для клонированного события
  //               ) : (
  //                 <MinusCircleOutlined
  //                   style={{ color: "rgb(148 148 148)", marginRight: 5, fontSize: "11px" }}
  //                 />
  //               )}
  //               <span>{event.content}</span>
  //             </li>
  //           ))}
  //         </ul>
  //       ) : null}
  //     </div>
  //   );
  // };

  const cellRender = (value) => {
    const date = value.format("YYYY-MM-DD");
    const events = calendarData[date];

    return (
      <div>
        {events && events.length > 0 ? (
          <ul className="events">
            {events
              .filter((event) => !event.isCloned) // Отфильтровываем клонированные события
              .map((event, index) => (
                <li key={index} style={{ color: event.color }}>
                  {/* <ArrowDownOutlined
                    style={{
                      color: "#FF2400",
                      marginRight: 5,
                      fontSize: "12px",
                    }}
                  /> */}
                  <span>{event.content}</span>
                </li>
              ))}
          </ul>
        ) : null}
      </div>
    );
  };

  useEffect(() => {
    const currentDate = moment();
    setCurrentMonth(currentDate.month());

    // Установка слушателя для данных календаря
    const calendarDataRef = collection(db, "calendarEvents");
    const calendarUnsubscribe = onSnapshot(calendarDataRef, (snapshot) => {
      const newCalendarData = {};
      snapshot.forEach((doc) => {
        const eventData = doc.data()?.events || []; // Проверка наличия свойства events
        newCalendarData[doc.id] = eventData.map((event) => {
          return {
            ...event,
            isCloned: event?.isCloned || false,
          };
        });
      });
      setCalendarData(newCalendarData);
    });

    // Установка слушателя для данных таблицы
    const tableDataRef = collection(db, "tableData");
    const notificationsShownThisUpdate = new Set(shownNotifications);

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
          !notificationsShownThisUpdate.has(event.eventId)
        ) {
          showNotification(event.tableContent, event.tableEnd, true);
          setShownNotifications((prevNotifications) => [
            ...prevNotifications,
            event.eventId,
          ]);
          notificationsShownThisUpdate.add(event.eventId);
        }
      });
    });

    // Возвращение функций очистки, чтобы отписаться при размонтировании компонента
    return () => {
      calendarUnsubscribe();
      tableUnsubscribe();
    };
  }, [shownNotifications]);

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
      duration: 5,
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
    <ConfigProvider locale={ruRU}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Header className="header">
          <div className="header__logo">
            <img src={logoImage} alt="Логотип" />
            <h3>
              Календарь<span> - кредита</span>
            </h3>
          </div>
        </Header>
        <Content className="content">
          <Row gutter={20}>
            <Col md={15} >
              <div className="сalendar-wrapper">
                <Calendar
                  onPanelChange={onPanelChange}
                  onSelect={onSelect}
                  cellRender={cellRender}
                />
                <Modal
                  title={`Добавление записи на ${selectedDate ? selectedDate.format("DD.MM.YYYY") : ""
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
                    style={{ marginBottom: '20px' }}
                  />



                  <Circle
                    colors={['#FF2400', '#008000', '#0094ff', '#bc00eb', '#0022e2', '#e4860b']}
                    color={eventColor}
                    onChange={(color) => {
                      setEventColor(color.hex);
                    }}
                  />
                </Modal>
                <Modal
                  title={"Редактирование записи"}
                  centered
                  open={editModalVisible}
                  onOk={handleEditOk}
                  onCancel={handleModalCancel}
                >
                  <Input
                    placeholder="Введите текст"
                    value={editingEventContent}
                    onChange={handleEditInputChange}
                    style={{ marginBottom: '10px' }}
                  />
                </Modal>
              </div>
            </Col>
            <Col md={9} >
              <div className="table-wrapper">
                {/* <Table
                  size="small"
                  columns={columns}
                  dataSource={tableData.map((item, index) => ({
                    ...item,
                    key: item.tableStart + index,
                  }))}
                  pagination={{ pageSize: 200 }}
                /> */}

                <Table
                  size="small"
                  columns={columns}
                  dataSource={tableData.map((item, index) => ({
                    ...item,
                    key: item.eventId || index, // Уникальный ключ для каждой строки
                  }))}
                  pagination={{
                    pageSize: 12,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} из ${total} записей`,
                  }}

                  rowClassName={(record) => {
                    const isOverdue = moment(record.tableEnd).isBefore(moment(), "day"); // Проверка на просроченность
                    return isOverdue ? "overdue-row" : ""; // Возвращаем класс для просроченных строк
                  }}
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
