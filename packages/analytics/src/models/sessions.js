import { Command, Session } from '@linux-odyssey/models'

export function sessionCount() {
  return Session.find().count()
}

export function sessionCompleted() {
  return Session.find({ status: 'finished' }).count()
}

export function averageTimeUsage() {
  return Session.aggregate([
    {
      $group: {
        _id: '$quest',
        average: {
          $avg: {
            $subtract: ['$finishedAt', '$createdAt'],
          },
        },
      },
    },
  ])
}

function formatTime(time) {
  const seconds = Math.floor(time / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m ${seconds % 60}s`
}

export async function sessionList() {
  const sessions = await Session.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'commands',
        localField: '_id',
        foreignField: 'session',
        as: 'commands',
      },
    },
  ])
  return sessions.map(
    ({ _id, user, quest, status, createdAt, finishedAt, commands }) => {
      return {
        _id,
        user: user.username,
        quest,
        status,
        createdAt: createdAt?.toLocaleString(),
        finishedAt: finishedAt?.toLocaleString(),
        usedTime: finishedAt ? formatTime(finishedAt - createdAt) : '',
        commandCount: commands?.length,
      }
    }
  )
}

export async function sessionDetail(id) {
  const session = await Session.findById(id).populate('user').exec()
  const commands = (await Command.find({ session: id })).map(
    ({ command, pwd, output, error, createdAt }) => ({
      command: command?.slice(0, 20),
      pwd,
      output: output?.slice(0, 50),
      error: error?.slice(0, 50),
      createdAt: createdAt?.toLocaleString(),
    })
  )
  const { _id, user, quest, status, createdAt, finishedAt } = session
  return {
    _id,
    user: user.username,
    quest,
    status,
    createdAt: createdAt?.toLocaleString(),
    finishedAt: finishedAt?.toLocaleString(),
    usedTime: finishedAt ? formatTime(finishedAt - createdAt) : '',
    commands,
  }
}