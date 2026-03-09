import client from './client'

export const getCategories = () =>
  client.get('/skills/categories').then((r) => r.data)

export const getMySkills = () =>
  client.get('/skills/mine').then((r) => r.data)

export const getUserSkills = (userId) =>
  client.get(`/skills/user/${userId}`).then((r) => r.data)

export const addOfferedSkill = (data) =>
  client.post('/skills/offered', data).then((r) => r.data)

export const addWantedSkill = (data) =>
  client.post('/skills/wanted', data).then((r) => r.data)

export const updateSkill = (id, data) =>
  client.put(`/skills/${id}`, data).then((r) => r.data)

export const deleteSkill = (id) =>
  client.delete(`/skills/${id}`)
