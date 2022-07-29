import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import * as uuid from 'uuid'

import { generateSignedUrl, updateAttachmentUrl } from '../../helpers/todos'
import { getUserId } from '../utils'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  try {
    const userId = getUserId(event)
    const attachmentId = uuid.v4()
    const uploadUrl = await generateSignedUrl(attachmentId)
    await updateAttachmentUrl(userId, todoId, attachmentId)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({uploadUrl})
    };

  } catch (error) {
    throw new Error(error);
  }
}
