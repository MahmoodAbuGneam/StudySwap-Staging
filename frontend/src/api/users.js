import client from './client'

export const getUser = (id) =>
  client.get(`/users/${id}`).then((r) => r.data)

export const updateMe = (data) =>
  client.put('/users/me', data).then((r) => r.data)
