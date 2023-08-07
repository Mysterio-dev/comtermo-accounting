import React, { useState } from "react";
import { Calendar, Modal, Input, Badge, Layout, message  } from "antd";
import { Col, Row } from "antd";
const { Content } = Layout;



const App = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [calendarData, setCalendarData] = useState({});

  const onPanelChange = (value, mode) => {
    console.log(value.format("YYYY-MM-DD"), mode);
    
    // Добавим проверку на выбранную дату, чтобы избежать открытия модального окна при смене месяца
    if (selectedDate) {
      const currentDate = selectedDate.format("YYYY-MM-DD");
      const panelDate = value.format("YYYY-MM-DD");
  
      // Если выбранная дата не соответствует дате в панели, закроем модальное окно
      if (currentDate !== panelDate) {
        setSelectedDate(null);
        setIsModalVisible(false);
      }
    }
  };

  const onSelect = (value) => {
    // Проверяем, есть ли выбранная дата (день месяца) в значении value
    if (value.date()) {
      const date = value.format("YYYY-MM-DD");
      const currentDate = selectedDate ? selectedDate.format("YYYY-MM-DD") : null;
  
      if (currentDate !== date) {
        setSelectedDate(value);
        setIsModalVisible(true);
      } else {
        setSelectedDate(null);
        setIsModalVisible(false);
      }
    }
  };

  

  const handleModalOk = () => {
    console.log("Сохранено:", inputValue);

    if (inputValue.trim() !== "") {
      setCalendarData((prevData) => {
        const date = selectedDate.format("YYYY-MM-DD");
        const eventsForDate = prevData[date]
          ? [...prevData[date], inputValue]
          : [inputValue];

        // Копируем содержимое ячейки только через 30 дней
        const nextDate = selectedDate
          .clone()
          .add(30, "days")
          .format("YYYY-MM-DD");
        prevData[nextDate] = eventsForDate;

        return {
          ...prevData,
          [date]: eventsForDate,
        };
      });

        // Показываем сообщение об успешном добавлении
        message.success("Данные успешно добавлены!");
    }

    setInputValue("");
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setInputValue("");
    setIsModalVisible(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Define a fixed array of colors in order
  const colors = ["#f50", "#2db7f5", "#87d068", "#108ee9"];

  // Function, which returns the color based on the index in the colors array
  const getColorByIndex = (index) => {
    return colors[index % colors.length];
  };

  // Function, which displays data in the calendar cell
  const cellRender = (value) => {
    const date = value.format("YYYY-MM-DD");
    const events = calendarData[date];

    return (
      <div>
        {events && events.length > 0 ? (
          <ul className="events">
            {events.map((event, index) => (
              <li key={index}>
                <Badge
                  status="success"
                  color={getColorByIndex(index)}
                  text={event}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  };

  return (
   
      <Layout>
        <Row>
          <Col span={18}>
            <Content className="custom-content">
              <Calendar
                onPanelChange={onPanelChange}
                onSelect={onSelect}
                cellRender={cellRender}
              />
              <Modal
                title={`Запись на ${
                  selectedDate ? selectedDate.format("DD/MM/YYYY") : ""
                }`}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
              >
                <Input
                  placeholder="Введите текст"
                  value={inputValue}
                  onChange={handleInputChange}
                />
              </Modal>
            </Content>
          </Col>
          <Col span={6}>
 
          </Col>
        </Row>
      </Layout>

  );
};

export default App;
