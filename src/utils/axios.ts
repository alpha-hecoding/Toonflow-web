import axios from "axios";
import router from "@/router/index";
import { message } from "ant-design-vue";
const baseURL = import.meta.env.VITE_BASE_URL;

const instance = axios.create({
  baseURL: baseURL,
  timeout: 60000 * 10 * 100,
});

instance.interceptors.request.use(function (config) {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// 添加响应拦截器
instance.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    if (error.status === 401) {
      localStorage.removeItem("token");
      router.push("/login");
      message.error("登录已过期，请重新登录");
    }

    let errorMessage = "服务异常";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data) {
      errorMessage = typeof error.response.data === "string" ? error.response.data : JSON.stringify(error.response.data);
    } else if (error.message) {
      errorMessage = error.message;
    }

    return Promise.reject({
      ...error,
      message: errorMessage,
    });
  },
);

export default instance;
