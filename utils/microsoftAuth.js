import * as msal from '@azure/msal-node'
import dotenv from 'dotenv'

dotenv.config()

const msalConfig = {
    auth: {
        clientId: process.env.CLIENTID,
        authority: `https://login.microsoftonline.com/${process.env.TENANTID}`,
        clientSecret: process.env.CLIENTSECRET,
    }
}
const cca = new msal.ConfidentialClientApplication(msalConfig)

const tokenRequest = {
    scopes: ['https://graph.microsoft.com/.default']
}

export const getToken = async () => {
    const authResponse = await cca.acquireTokenByClientCredential(tokenRequest)
        .then((data) => {
            return data.accessToken
        })
        .catch(error => {
            console.log('error aquiring access token:', error)
        })

    return authResponse
}