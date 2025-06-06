import { IFileExistenceInput, IFileExistenceChecker } from '../schema'

export async function checkFiles(
  checker: IFileExistenceChecker,
  files: IFileExistenceInput[]
) {
  const existences = await Promise.all(
    files.map((file) => checker.exists(file))
  )
  return existences.every((exists, index) => exists === files[index].exists)
}
