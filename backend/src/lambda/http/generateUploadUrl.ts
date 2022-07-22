import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import * as uuid from 'uuid'
import { generateSignedUrl, updateAttachmentUrl } from '../../helpers/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    try {
      const userId = getUserId(event)
      const attachmentId = uuid.v4()
      const uploadUrl = await generateSignedUrl(attachmentId)
      await updateAttachmentUrl(userId, todoId, attachmentId)

      return {
        statusCode: 200,
        body: JSON.stringify({uploadUrl})
      };

    } catch (error) {
      throw new Error(error);
    }
})

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
