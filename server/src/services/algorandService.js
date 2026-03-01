import algosdk from 'algosdk'
import crypto from 'crypto'

const ALGORAND_ALGOD_TOKEN = process.env.ALGORAND_ALGOD_TOKEN || ''
const ALGORAND_ALGOD_SERVER = process.env.ALGORAND_ALGOD_SERVER || 'https://testnet-api.algonode.cloud'
const ALGORAND_ALGOD_PORT = process.env.ALGORAND_ALGOD_PORT || 443

const algodClient = new algosdk.Algodv2(ALGORAND_ALGOD_TOKEN, ALGORAND_ALGOD_SERVER, ALGORAND_ALGOD_PORT)

const NOTARY_MNEMONIC = process.env.ALGORAND_NOTARY_MNEMONIC

export async function notarizeSuspiciousActivity(loginLog) {
  if (!NOTARY_MNEMONIC) {
    console.warn('Algorand notary not configured, skipping blockchain notarization')
    return null
  }

  try {
    const notaryAccount = algosdk.mnemonicToSecretKey(NOTARY_MNEMONIC)
    
    const auditRecord = {
      logId: loginLog._id.toString(),
      userId: loginLog.userId?.toString() || 'unknown',
      email: loginLog.email,
      eventType: loginLog.eventType,
      ipAddress: loginLog.ipAddress,
      suspicionReasons: loginLog.suspicionReasons,
      timestamp: loginLog.timestamp.toISOString(),
      hash: createHash(loginLog)
    }

    const note = new TextEncoder().encode(JSON.stringify(auditRecord))
    
    const suggestedParams = await algodClient.getTransactionParams().do()
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: notaryAccount.addr,
      to: notaryAccount.addr,
      amount: 0,
      note: note,
      suggestedParams: suggestedParams
    })
    
    const signedTxn = txn.signTxn(notaryAccount.sk)
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do()
    
    await algosdk.waitForConfirmation(algodClient, txId, 4)
    
    console.log(`Audit trail stored on Algorand: ${txId}`)
    return txId
  } catch (error) {
    console.error('Algorand notarization failed:', error)
    return null
  }
}

function createHash(loginLog) {
  const data = `${loginLog._id}|${loginLog.userId}|${loginLog.timestamp}|${loginLog.ipAddress}|${loginLog.eventType}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

export async function verifyAuditTrail(txId) {
  try {
    const txn = await algodClient.pendingTransactionInformation(txId).do()
    if (txn.txn?.txn?.note) {
      const note = Buffer.from(txn.txn.txn.note, 'base64').toString('utf-8')
      return JSON.parse(note)
    }
    return null
  } catch (error) {
    console.error('Failed to verify audit trail:', error)
    return null
  }
}

export function getExplorerUrl(txId) {
  const network = (ALGORAND_ALGOD_SERVER.includes('testnet')) ? 'testnet' : 'mainnet'
  return `https://${network}.algoexplorer.io/tx/${txId}`
}
