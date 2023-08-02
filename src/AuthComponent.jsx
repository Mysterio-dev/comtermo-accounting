import { useState, useEffect} from "react";
import { Form, Input, Button, message as antdMessage, Checkbox } from "antd";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import logoImage from "./assets/logo.png";
import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";




const AuthComponent = ({ firebase, setIsLoggedIn }) => {


  const particlesInit = useCallback(async engine => {      
    await loadFull(engine);
  }, []);
  
  const particlesLoaded = useCallback(async container => {
  await console.log(container);
  }, []);

  const [loading, setLoading] = useState(false);
  const auth = getAuth(firebase);
  const [rememberMe, setRememberMe] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    const email = localStorage.getItem("rememberedEmail");
    const password = localStorage.getItem("rememberedPassword");
  
    if (email && password) {
      form.setFieldsValue({ email, password });
      setRememberMe(true); // Здесь устанавливается rememberMe в true
      const lastLoginTime = localStorage.getItem("lastLoginTime");
      if (lastLoginTime) {
        const now = Date.now();
        const dayInMilliseconds = 24 * 60 * 60 * 1000; // 24 часа
        if (now - Number(lastLoginTime) > dayInMilliseconds) {
          form.resetFields();
          setRememberMe(false); // Установим rememberMe в false только здесь
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
          localStorage.removeItem("lastLoginTime");
        }
      }
    }
  }, [form]);
  

  const onFinish = (values) => {
    setLoading(true);
    const { email, password } = values;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log("Вход выполнен:", user);
        setIsLoggedIn(true);
        setLoading(false);
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("rememberedPassword", password);
          localStorage.setItem("lastLoginTime", Date.now());
        }
        // Показываем сообщение об успешном входе
        antdMessage.success("Вход выполнен успешно!");
      })

      .catch((error) => {
        console.error("Ошибка входа:", error);
        setLoading(false);
        antdMessage.error(
          "Ошибка входа. Пожалуйста, проверьте ваш Email и пароль."
        );
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
            Comtermo<span> - календарь</span>
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
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            >
              Запомнить меня
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}>
              Войти
            </Button>
          </Form.Item>
        </Form>
        <Particles
  id="tsparticles"
  init={particlesInit}
  loaded={particlesLoaded}
  options={{ "fullScreen": false, "background":{ "image":" linear-gradient(19deg, #21D4FD 0%, #B721FF 100%)" }, "particles":{ "number":{ "value":10, "density":{ "enable":true, "value_area":600 } }, "color":{ "value":"#ffffff" }, "shape": { "type": "square", "stroke":{ "width":0, "color":"#000000" }, "polygon":{ "nb_sides":5 } }, "opacity":{ "value":0.25, "random":true, "anim":{ "enable":false, "speed":1, "opacity_min":0.1, "sync":false } }, "size":{ "value":29, "random":true, "anim":{ "enable":false, "speed":2, "size_min":0.1, "sync":false } }, "line_linked":{ "enable":false, "distance":300, "color":"#ffffff", "opacity":0, "width":0 }, "move":{ "enable":true, "speed":0.5, "direction":"top", "straight":true, "out_mode":"out", "bounce":false, "attract":{ "enable":false, "rotateX":600, "rotateY":1200 } } }, "interactivity":{ "detect_on":"canvas", "events":{ "onhover":{ "enable":false, "mode":"repulse" }, "onclick":{ "enable":false, "mode":"push" }, "resize":true }, "modes":{ "grab":{ "distance":800, "line_linked":{ "opacity":1 } }, "bubble":{ "distance":790, "size":79, "duration":2, "opacity":0.8, "speed":3 }, "repulse":{ "distance":400, "duration":0.4 }, "push":{ "particles_nb":4 }, "remove":{ "particles_nb":2 } } }, "retina_detect":true}}
          />
      </div>
    </div>
  );
};

export default AuthComponent;
