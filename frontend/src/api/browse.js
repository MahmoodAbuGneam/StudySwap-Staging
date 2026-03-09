import client from './client'

export const browseUsers = (params) =>
  client.get('/browse/users', { params }).then((r) => r.data)

export const browseSkills = (params) =>
  client.get('/browse/skills', { params }).then((r) => r.data)
