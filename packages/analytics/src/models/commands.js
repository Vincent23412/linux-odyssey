import mongoose from 'mongoose'
import { Command } from '@linux-odyssey/models'

// eslint-disable-next-line import/prefer-default-export
export async function errorCommands({ nextKey, itemsPerPage, order }) {
  let matchStage = {}
  if (nextKey) {
    const key = new mongoose.Types.ObjectId(nextKey)
    matchStage = { _id: order.matchStage(key) }
  }
  console.log(matchStage, itemsPerPage, nextKey, order)
  const commands = await Command.aggregate([
    { $match: matchStage },
    {
      $match: {
        $and: [
          { error: { $exists: true } },
          { error: { $ne: null } },
          { error: { $ne: '' } },
        ],
      },
    },
    {
      $lookup: {
        from: 'sessions', // 替換成 'session' 對應的集合名稱
        localField: 'session', // 替換成 'session' 對應的字段名稱
        foreignField: '_id',
        as: 'session',
      },
    },
    { $unwind: '$session' },
    {
      $lookup: {
        from: 'users', // 替換成 'user' 對應的集合名稱
        localField: 'session.user', // 替換成 'user' 對應的字段名稱
        foreignField: '_id',
        as: 'session.user',
      },
    },
    { $unwind: '$session.user' },
    { $sort: { _id: order.order() } },
    { $limit: itemsPerPage },
  ])

  return commands.map(({ _id, command, error, createdAt, session }) => {
    const { user, quest } = session
    return {
      _id,
      command: command.slice(0, 20),
      error: error.slice(0, 50),
      createdAt: createdAt?.toLocaleString(),
      user: user?.username,
      quest,
      session: session._id,
    }
  })
}
