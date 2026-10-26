const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand, TransactWriteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
class Store {
  constructor(table, client = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } })) { this.table = table; this.client = client; }
  async get(pk, sk) { return (await this.client.send(new GetCommand({ TableName: this.table, Key: { pk, sk }, ConsistentRead: true }))).Item; }
  async put(item, condition) { await this.client.send(new PutCommand({ TableName: this.table, Item: item, ...(condition ? { ConditionExpression: condition } : {}) })); }
  async delete(pk, sk) { await this.client.send(new DeleteCommand({ TableName: this.table, Key: { pk, sk } })); }
  async list(pk) {
    const rows = []; let cursor;
    do { const r = await this.client.send(new QueryCommand({ TableName: this.table, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': pk }, ExclusiveStartKey: cursor, ConsistentRead: true })); rows.push(...(r.Items || [])); cursor = r.LastEvaluatedKey; if (rows.length > 5000) throw Object.assign(new Error('Please narrow this request.'), { status: 413 }); } while (cursor);
    return rows;
  }
  async transact(entries) { await this.client.send(new TransactWriteCommand({ TransactItems: entries.map(entry => { const type = Object.keys(entry)[0]; return { [type]: { TableName: this.table, ...entry[type] } }; }) })); }
  async limit(key, maximum, seconds) {
    const bucket = Math.floor(Date.now() / (seconds * 1000));
    try { await this.client.send(new UpdateCommand({ TableName: this.table, Key: { pk: `LIMIT#${key}`, sk: String(bucket) }, UpdateExpression: 'SET expiresAt = :ttl ADD attempts :one', ConditionExpression: 'attribute_not_exists(attempts) OR attempts < :max', ExpressionAttributeValues: { ':ttl': (bucket + 2) * seconds, ':one': 1, ':max': maximum } })); }
    catch (e) { if (e.name === 'ConditionalCheckFailedException') throw Object.assign(new Error('Too many requests. Please try again later.'), { status: 429 }); throw e; }
  }
}
module.exports = { Store };
