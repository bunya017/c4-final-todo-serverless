import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload';



const logger = createLogger('auth')
const jwksUrl = 'https://dev-a6ruimn7.us.auth0.com/.well-known/jwks.json'
let cert: string

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken);
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  const keyId = jwt.header.kid
  logger.info(`KEYID: ${keyId}`)

  const cert = await getSignKey(keyId);
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

async function getSignKey(keyId: string) {
  if (cert) return cert;
  const response = await Axios.get(jwksUrl);

  const keys = response.data.keys;

  logger.info('KEYS', keys);

  if (!keys || !keys.length) throw new Error('No JWKS keys found')

  const signingKeys = keys.filter(key => (
    key.use === 'sig' &&
    key.kty === 'RSA' &&
    key.alg === 'RS256' &&
    key.n &&
    key.e && 
    key.kid === keyId &&
    key.x5c &&
    key.x5c.length
  ));

  if (!signingKeys.length) throw new Error('No signing keys found')

  const matched = signingKeys[0]
  cert = getPemFromCert(matched.x5c[0])

  logger.info('PEM CERTIFICATE', cert);
  return cert;
}

function getPemFromCert(cert: string): string {
  let pem = cert.match(/.{1,64}/g).join('\n')
  return `-----BEGIN CERTIFICATE-----\n${pem}\n-----END CERTIFICATE-----\n`
}
