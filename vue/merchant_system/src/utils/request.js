import axios from 'axios'
const request = axios.create({ baseURL: '/api' })

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = token
  return config
})


request.interceptors.response.use(res => {
  return res.data
}, err => {

  return Promise.reject(err)
})

export default request