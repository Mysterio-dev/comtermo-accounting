import { useState, useEffect } from "react";
import { Form, Input, Button, message as antdMessage, Checkbox } from "antd";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { doc, setDoc, getDoc } from "firebase/firestore";
import logoImage from "./assets/logo.png";
import { initializeApp } from "firebase/app";

import "firebase/auth";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMENFkqkVFAMWpxLSFWsGB2AWsGiPbG5s",
  authDomain: "comtermo-calendar.firebaseapp.com",
  projectId: "comtermo-calendar",
  storageBucket: "comtermo-calendar.appspot.com",
  messagingSenderId: "645495264257",
  appId: "1:645495264257:web:cc88185130b4b4777a1c00",
  measurementId: "G-PQ6DC10E55",
};

// Инициализация Firebase
initializeApp(firebaseConfig);



const AuthComponent = ({ setIsLoggedIn }) => {
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const db = getFirestore();
  const [rememberMe, setRememberMe] = useState(true);
  const [form] = Form.useForm();


  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const lastLoginTime = userDocSnapshot.data().lastLoginTime.toMillis();
          const now = Date.now();
          const dayInMilliseconds = 24 * 60 * 60 * 1000; // 24 часа

          if (now - lastLoginTime > dayInMilliseconds) {
            // Выход из аккаунта
            auth.signOut();
          } else {
            setIsLoggedIn(true);
          }
        } else {
          // Если документ не существует, создаем новый
          await setDoc(userDocRef, { lastLoginTime: new Date() });
        }
      }
    };

    fetchData();
  }, [auth, db, setIsLoggedIn]);

  const onFinish = async (values) => {
    setLoading(true);
    const { email, password } = values;

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        setIsLoggedIn(true);
        setLoading(false);

        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { lastLoginTime: new Date() }, { merge: true });

       
      })
      .catch((error) => {
        console.error("Ошибка входа:", error);
        setLoading(false);
        antdMessage.error("Ошибка входа. Пожалуйста, проверьте ваш Email и пароль.");
      });
  };
  
  const onFinishFailed = (errorInfo) => {
    console.error("Ошибка заполнения формы:", errorInfo);
  };

  return (
    <div className="authContainer">
      <div className="authContainer__wrap">
        <div className="authContainer__logo">
          <img src={logoImage} alt="Логотип" />
        </div>
        <h3 className="authContainer__title">
        Календарь <span>кредита</span> 
        </h3>
        <Form
          name="login"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                type: "email",
                message: "Пожалуйста, введите ваш Email!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              {
                required: true,
                message: "Пожалуйста, введите ваш пароль!",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>


          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              loading={loading}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>

      </div>

    </div>
    
  );
};

export default AuthComponent;
