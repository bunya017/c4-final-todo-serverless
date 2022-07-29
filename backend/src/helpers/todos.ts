import 'source-map-support/register'
import { TodosAccess } from './todosAcess'
import { getAttachmentUrl, getUploadUrl } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'


const logger = createLogger('businessLogic/todos')
const Todo = new TodosAccess()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  logger.info(`Retrieving all todos for user ${userId}`, { userId })
  return await Todo.getTodoItems(userId)
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
  const todoId = uuid.v4()
  const newItem: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: null,
    ...createTodoRequest
  }
  if (newItem.name.length === 0) {
    logger.error('Name field is required!')
    throw new Error('Name field is required!')
  }
  logger.info(`Creating todo ${todoId} for user ${userId}`, { userId, todoId, todoItem: newItem })
  await Todo.createTodoItem(newItem)

  return newItem
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest) {
  logger.info(`Updating todo ${todoId} for user ${userId}`, { userId, todoId, todoUpdate: updateTodoRequest })
  await Todo.updateTodoItem(userId, todoId, updateTodoRequest as TodoUpdate)
}

export async function deleteTodo(userId: string, todoId: string) {
  logger.info(`Deleting todo ${todoId} for user ${userId}`, { userId, todoId })
  await Todo.deleteTodoItem(userId, todoId)
}

export async function updateAttachmentUrl(userId: string, todoId: string, attachmentId: string) {
  logger.info(`Generating attachment URL for attachment ${attachmentId}`)
  const attachmentUrl = await getAttachmentUrl(attachmentId)
  logger.info(`Updating todo ${todoId} with attachment URL ${attachmentUrl}`, { userId, todoId })
  await Todo.updateAttachmentUrl(userId, todoId, attachmentUrl)
}

export async function generateSignedUrl(attachmentId: string): Promise<string> {
  logger.info(`Generating upload URL for attachment ${attachmentId}`)
  const uploadUrl = await getUploadUrl(attachmentId)
  return uploadUrl
}