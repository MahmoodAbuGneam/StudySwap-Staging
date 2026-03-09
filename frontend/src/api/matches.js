import client from './client'

export const getMatches = () =>
  client.get('/matches').then((r) => r.data)
