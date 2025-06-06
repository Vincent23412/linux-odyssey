/* eslint-disable max-classes-per-file */
import fs from 'fs/promises'
import path from 'path'
import yaml from 'yaml'

import {
  questSchema,
  globalExceptionSchema,
  IQuest,
} from '../../../packages/game'
import logger from '../utils/logger.js'
import config from '../config.js'

class QuestValidationError extends Error {
  questId: string
  error: any

  constructor(message: string, questId: string, error: any) {
    super(message)
    this.name = 'QuestValidationError'
    this.questId = questId
    this.error = error
  }

  toString() {
    if (this.error?.issues) {
      const issues = this.error.issues
        .map((issue: any) => {
          const fieldPath = issue.path.join('.')
          return `- ${fieldPath}: ${issue.message}`
        })
        .join('\n')
      return `Error in quest "${this.questId}":\n${issues}`
    }
    return `Error in quest "${this.questId}": ${this.message}`
  }
}

class QuestManager {
  private quests = new Map<string, IQuest>()
  private questDirectory = path.join(config.projectRoot, 'quests')

  get(id: string) {
    return this.quests.get(id)
  }

  getAll() {
    return Array.from(this.quests.values())
  }

  private async mapQuests(callback: QuestCallback) {
    const questNames = await fs.readdir(this.questDirectory, {
      withFileTypes: true,
    })

    return Promise.all(
      questNames
        .filter(
          (dirent) => dirent.isDirectory() && !dirent.name.startsWith('.')
        )
        .map((dirent) => {
          const id = dirent.name
          const questPath = path.join(this.questDirectory, id)
          return callback(id, questPath)
        })
    )
  }

  private async loadGlobalExceptions() {
    try {
      const exceptionsPath = path.join(this.questDirectory, 'exceptions.yml')
      const body = await fs.readFile(exceptionsPath, 'utf-8')
      return globalExceptionSchema.array().parse(yaml.parse(body))
    } catch (error) {
      logger.error('Error loading global exceptions', { error })
      throw new QuestValidationError(
        'Failed to load global exceptions',
        'global',
        error
      )
    }
  }

  async loadAndUpdateQuests() {
    const exceptions = await this.loadGlobalExceptions()
    return this.mapQuests(async (id, questPath) => {
      const files = await fs.readdir(questPath)
      if (!files.includes('game.yml')) {
        throw new QuestValidationError(`Missing game.yml`, id, null)
      }

      try {
        const body = await fs.readFile(
          path.join(questPath, 'game.yml'),
          'utf-8'
        )

        const questData = yaml.parse(body, {
          merge: true,
        })

        const image = files.includes('Dockerfile') ? id : 'base'
        const quest = questSchema.parse({
          id,
          image,
          ...questData,
        })
        quest.exceptions = [...exceptions]
        this.quests.set(id, quest)
      } catch (error) {
        logger.error(`Error parsing quest ${id}`, { error })
        throw new QuestValidationError(`Error parsing quest ${id}`, id, error)
      }
    })
  }

  async getQuestDockerfiles() {
    const questlist = await this.mapQuests(async (id, questPath) => {
      const files = await fs.readdir(questPath)
      return files.includes('Dockerfile') ? { id, questPath } : null
    })
    return questlist.filter((quest) => quest !== null)
  }
}

// eslint-disable-next-line no-unused-vars
type QuestCallback = (id: string, questPath: string) => Promise<any>

export const questManager = new QuestManager()
