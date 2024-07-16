import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager'
import crypto from 'crypto'
import dayjs from 'dayjs'

const secretClient = new SecretsManagerClient({ region: 'us-west-1' })

export const handler = async(event:any) => {

  // let Land.Collect know we have processed the files
  const secret = await getSecret()
  const authorization = crypto.createHmac('sha256', secret).update(dayjs().format('YYYY-MM-DD HH:mm')).digest('hex')

  const apiRequest = {
    method: 'post',
    headers: {
      authorization: `bearer ${authorization}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  }

  console.log('apiRequest', apiRequest)

  let responseUrl = 'https://api.madronus.com/craft/v1/handle-scheduled/'
  
  await fetch(responseUrl, apiRequest)
  .then(async res => {
    console.log('apiResponse', res && await res.json())
  })
  .catch((err) => {
    console.error('ERROR', err)
  })

  return true
}

async function getSecret() {
  const command = new GetSecretValueCommand({
    SecretId: 'craft/s2s/secret'
  })
  const data = await secretClient.send(command)
  if (data && data.SecretString) {
    const json = JSON.parse(data.SecretString)
    if (json && json.secret) {
      return json.secret
    }
  }
  return null
}