// Redis executes the entire check/decrement/consume atomically, preserving TTL.
export const VERIFY_EMAIL_CODE_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local ok, record = pcall(cjson.decode, raw)
if not ok or type(record) ~= 'table'
  or type(record.codeHash) ~= 'string' or #record.codeHash ~= 64
  or type(record.attemptsRemaining) ~= 'number'
  or record.attemptsRemaining < 1 then
  redis.call('DEL', KEYS[1])
  return 0
end
local same = #ARGV[1] == 64
for i = 1, 64 do
  if string.byte(record.codeHash, i) ~= string.byte(ARGV[1], i) then same = false end
end
if same then
  redis.call('DEL', KEYS[1])
  return 1
end
record.attemptsRemaining = record.attemptsRemaining - 1
if record.attemptsRemaining <= 0 then
  redis.call('DEL', KEYS[1])
else
  redis.call('SET', KEYS[1], cjson.encode(record), 'KEEPTTL')
end
return 0
`;
