import {
  parseLotteryResultText,
  extractLineTokens,
  isRecognizedLabelOrMeta,
  cleanLotteryText,
} from './resultOcrUtils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Assertion Failed: ${message}\nExpected: ${JSON.stringify(expected)}\nGot: ${JSON.stringify(actual)}`);
  }
}

console.log('--- Starting Universal Separator Result Extraction Parser Tests ---\n');

// TEST 1: Double-dot separators with trailing non-number token '1*1'
{
  const input = '833..862..864..354..364..587..1*1';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864', '354', '364', '587'], 'Test 1 numbers');
  assertEqual(tokens.uncertainTokens, ['1*1'], 'Test 1 uncertain tokens');

  const parsed = parseLotteryResultText(input);
  assert(parsed.prize1 === '833', 'Test 1: prize1 should be 833');
  assert(parsed.prize2 === '862', 'Test 1: prize2 should be 862');
  assert(parsed.prize3 === '864', 'Test 1: prize3 should be 864');
  assert(parsed.prize4 === '354', 'Test 1: prize4 should be 354');
  assert(parsed.prize5 === '364', 'Test 1: prize5 should be 364');
  assert(parsed.prize6 === '587', 'Test 1: prize6 should be 587');
  assertEqual(parsed.uncertainTokens, ['1*1'], 'Test 1: uncertain tokens preserved for admin verification');
  assert(parsed.extractedCount === 6, 'Test 1: 6 prizes extracted');
  console.log('✓ Test 1 Passed: 833..862..864..354..364..587..1*1 correctly parsed with 1*1 preserved');
}

// TEST 2: Hyphen separators
{
  const input = '833-862-864-354-364-587';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864', '354', '364', '587'], 'Test 2 numbers');
  assertEqual(tokens.uncertainTokens, [], 'Test 2 no uncertain tokens');

  const parsed = parseLotteryResultText(input);
  assert(parsed.prize1 === '833' && parsed.prize2 === '862' && parsed.prize3 === '864' && parsed.prize4 === '354' && parsed.prize5 === '364' && parsed.prize6 === '587', 'Test 2 prizes');
  assert(parsed.uncertainTokens.length === 0, 'Test 2: no uncertain tokens');
  assert(parsed.extractedCount === 6, 'Test 2: 6 prizes extracted');
  console.log('✓ Test 2 Passed: 833-862-864-354-364-587 correctly parsed with hyphens');
}

// TEST 3: Slash separators with spaces
{
  const input = '833 / 862 / 864 / 354 / 364 / 587';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864', '354', '364', '587'], 'Test 3 numbers');
  assertEqual(tokens.uncertainTokens, [], 'Test 3 no uncertain tokens');

  const parsed = parseLotteryResultText(input);
  assert(parsed.prize1 === '833' && parsed.prize2 === '862' && parsed.prize3 === '864' && parsed.prize4 === '354' && parsed.prize5 === '364', 'Test 3 prizes');
  console.log('✓ Test 3 Passed: 833 / 862 / 864 / 354 / 364 / 587 correctly parsed with slashes');
}

// TEST 4: Comma separators with spaces
{
  const input = '833, 862, 864, 354, 364, 587';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864', '354', '364', '587'], 'Test 4 numbers');
  assertEqual(tokens.uncertainTokens, [], 'Test 4 no uncertain tokens');

  const parsed = parseLotteryResultText(input);
  assert(parsed.prize1 === '833' && parsed.prize2 === '862' && parsed.prize3 === '864' && parsed.prize4 === '354' && parsed.prize5 === '364', 'Test 4 prizes');
  console.log('✓ Test 4 Passed: 833, 862, 864, 354, 364, 587 correctly parsed with commas');
}

// TEST 5: Asterisk separators
{
  const input = '833*862*864*354*364*587';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864', '354', '364', '587'], 'Test 5 numbers');
  assertEqual(tokens.uncertainTokens, [], 'Test 5 no uncertain tokens');

  const parsed = parseLotteryResultText(input);
  assert(parsed.prize1 === '833' && parsed.prize2 === '862' && parsed.prize3 === '864' && parsed.prize4 === '354' && parsed.prize5 === '364', 'Test 5 prizes');
  console.log('✓ Test 5 Passed: 833*862*864*354*364*587 correctly parsed with asterisks');
}

// TEST 6: Multiple spaces and single spaces
{
  const input = '833    862   864  354 364   587';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864', '354', '364', '587'], 'Test 6 numbers');
  console.log('✓ Test 6 Passed: Spaces & multiple spaces preserved and separated');
}

// TEST 7: Underscores, parentheses, colons, semicolons, and pipes
{
  const inputUnderscore = '833_862_864_354_364_587';
  assertEqual(extractLineTokens(inputUnderscore).numbers, ['833', '862', '864', '354', '364', '587'], 'Test 7 underscores');

  const inputParen = '(833)(862)(864)(354)(364)(587)';
  assertEqual(extractLineTokens(inputParen).numbers, ['833', '862', '864', '354', '364', '587'], 'Test 7 parens');

  const inputColonSemi = '833:862;864:354;364:587';
  assertEqual(extractLineTokens(inputColonSemi).numbers, ['833', '862', '864', '354', '364', '587'], 'Test 7 colon/semi');

  const inputPipe = '833|862|864|354|364|587';
  assertEqual(extractLineTokens(inputPipe).numbers, ['833', '862', '864', '354', '364', '587'], 'Test 7 pipes');
  console.log('✓ Test 7 Passed: Underscores, parentheses, colons, semicolons, pipes all work seamlessly');
}

// TEST 8: Mixed combination of separators
{
  const input = '833..862-864 / 354*364_587';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864', '354', '364', '587'], 'Test 8 numbers');
  console.log('✓ Test 8 Passed: Mixed combination of separators extracted flawlessly');
}

// TEST 9: Preserve leading zeros strictly
{
  const input = '001..020..092..007..045..000';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['001', '020', '092', '007', '045', '000'], 'Test 9 leading zeros');
  assert(tokens.numbers[0] === '001', 'Test 9: 001 preserved as string');
  assert(tokens.numbers[1] === '020', 'Test 9: 020 preserved as string');
  assert(tokens.numbers[2] === '092', 'Test 9: 092 preserved as string');
  assert(tokens.numbers[5] === '000', 'Test 9: 000 preserved as string');
  console.log('✓ Test 9 Passed: Leading zeros strictly preserved as strings');
}

// TEST 10: Preserve legitimate duplicate occurrences
{
  const input = '833..862..864..354..354..587';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864', '354', '354', '587'], 'Test 10 duplicates');
  assert(tokens.numbers[3] === '354' && tokens.numbers[4] === '354', 'Test 10: duplicate 354 preserved in order');
  console.log('✓ Test 10 Passed: Legitimate duplicate occurrences preserved in exact positions');
}

// TEST 11: Do not merge adjacent numbers
{
  const input = '833 862 864';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864'], 'Test 11 distinct numbers');
  assert(!tokens.numbers.includes('833862'), 'Test 11: adjacent numbers not merged into 833862');
  console.log('✓ Test 11 Passed: Adjacent numbers are never merged');
}

// TEST 12: Do not truncate numbers
{
  const input = '1234..833..862..9999';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862'], 'Test 12 valid 3-digit numbers only');
  assert(!tokens.numbers.includes('123'), 'Test 12: 1234 not truncated into 123');
  assert(!tokens.numbers.includes('234'), 'Test 12: 1234 not truncated into 234');
  assert(!tokens.numbers.includes('999'), 'Test 12: 9999 not truncated into 999');
  assert(tokens.uncertainTokens.includes('1234'), 'Test 12: 1234 preserved in uncertain tokens');
  assert(tokens.uncertainTokens.includes('9999'), 'Test 12: 9999 preserved in uncertain tokens');
  console.log('✓ Test 12 Passed: Non-3-digit numbers are never truncated and saved in uncertainTokens');
}

// TEST 13: Continuous 6-digit number without separator is not blindly chopped
{
  const input = '833862..354..364';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['354', '364'], 'Test 13: 833862 not chopped');
  assert(tokens.uncertainTokens.includes('833862'), 'Test 13: 833862 preserved in uncertain tokens');
  console.log('✓ Test 13 Passed: Continuous multi-digit number without separator not blindly chopped');
}

// TEST 14: Preserve additional non-number tokens and never silently discard
{
  const input = '833..862..864..354..364..587..1*1..PendingCheck';
  const tokens = extractLineTokens(input);
  assertEqual(tokens.numbers, ['833', '862', '864', '354', '364', '587'], 'Test 14 numbers');
  assertEqual(tokens.uncertainTokens, ['1*1', 'PendingCheck'], 'Test 14 uncertain tokens');

  const parsed = parseLotteryResultText(input);
  assertEqual(parsed.uncertainTokens, ['1*1', 'PendingCheck'], 'Test 14 parsed uncertain tokens');
  console.log('✓ Test 14 Passed: Multiple unknown non-number tokens preserved in uncertainTokens');
}

// TEST 15: Section awareness - Do not interpret dates, years, times, or handles as prizes
{
  const fullResultSheet = `
08-11-2028
SUNDAY 1 PM
Draw Time: 1:00 PM
Join Telegram @Sbookkerala2
1st 381
2nd 265
3rd 368
4th 323
5th 352
COMPLIMENTS
020 355 554
092 365 612
096 385 690
103 386 690
180 387 736
188 391 747
228 393 755
268 434 817
309 508 892
345 510 971
Result by Shook
`;
  const parsed = parseLotteryResultText(fullResultSheet);
  assert(parsed.prize1 === '381', 'Test 15: prize 1 is 381');
  assert(parsed.prize2 === '265', 'Test 15: prize 2 is 265');
  assert(parsed.prize3 === '368', 'Test 15: prize 3 is 368');
  assert(parsed.prize4 === '323', 'Test 15: prize 4 is 323');
  assert(parsed.prize5 === '352', 'Test 15: prize 5 is 352');
  assert(parsed.extractedCount === 35, `Test 15: expected 35 results extracted, got ${parsed.extractedCount}`);
  assert(parsed.complimentBoxes[0] === '020', 'Test 15: compliment col 1 row 0');
  assert(parsed.complimentBoxes[10] === '355', 'Test 15: compliment col 2 row 0');
  assert(parsed.complimentBoxes[20] === '554', 'Test 15: compliment col 3 row 0');
  // Duplicate 690 in compliments preserved
  assert(parsed.complimentBoxes[22] === '690' && parsed.complimentBoxes[23] === '690', 'Test 15: duplicate 690 preserved in col 3');
  console.log('✓ Test 15 Passed: Section awareness verified (date, time, Telegram handle ignored, 35 results extracted)');
}

// TEST 16: Full OCR text with universal separators in compliments table and uncertain token
{
  const fullResultWithSeparators = `
04-11-2026
WEDNESDAY 8 PM
1st: 381
2nd: 265
3rd: 169
4th: 668
5th: 788
COMPLIMENTS:
033..303..621
109-324-649
119/349/692
160*402*821
181, 424, 823
231|514|864
232:528:867
259;577;908
281_591_988
(298)(609)(999)..1*1
`;
  const parsed = parseLotteryResultText(fullResultWithSeparators);
  assert(parsed.prize1 === '381' && parsed.prize2 === '265' && parsed.prize3 === '169' && parsed.prize4 === '668' && parsed.prize5 === '788', 'Test 16 prizes');
  assert(parsed.extractedCount === 35, `Test 16: expected 35 results, got ${parsed.extractedCount}`);
  assertEqual(parsed.uncertainTokens, ['1*1'], 'Test 16 uncertain token 1*1 preserved');
  assert(parsed.complimentBoxes[0] === '033', 'Test 16 comp 0');
  assert(parsed.complimentBoxes[9] === '298', 'Test 16 comp 9');
  assert(parsed.complimentBoxes[19] === '609', 'Test 16 comp 19');
  assert(parsed.complimentBoxes[29] === '999', 'Test 16 comp 29');
  console.log('✓ Test 16 Passed: Full compliments matrix with varied separators and 1*1 preserved');
}

// TEST 17: OCR text normalization for 'O' instead of '0' with various separators
{
  const input = 'O33..3O3-62O / o92*5O5';
  const cleaned = cleanLotteryText(input);
  const tokens = extractLineTokens(cleaned);
  assertEqual(tokens.numbers, ['033', '303', '620', '092', '505'], 'Test 17 OCR O to 0');
  console.log('✓ Test 17 Passed: OCR "O" and "o" normalized across all separators');
}

// TEST 18: Recognized label and metadata detection
{
  assert(isRecognizedLabelOrMeta('1ST') === true, 'Test 18: 1ST is recognized');
  assert(isRecognizedLabelOrMeta('2nd') === true, 'Test 18: 2nd is recognized');
  assert(isRecognizedLabelOrMeta('COMPLIMENT') === true, 'Test 18: COMPLIMENT is recognized');
  assert(isRecognizedLabelOrMeta('5,000') === true, 'Test 18: 5,000 is recognized');
  assert(isRecognizedLabelOrMeta('1*1') === false, 'Test 18: 1*1 is not a recognized label');
  assert(isRecognizedLabelOrMeta('PendingCheck') === false, 'Test 18: PendingCheck is not a recognized label');
  console.log('✓ Test 18 Passed: isRecognizedLabelOrMeta correctly classifies prize labels vs uncertain tokens');
}

console.log('\n======================================================');
console.log('ALL UNIVERSAL SEPARATOR RESULT PARSER TESTS PASSED!');
console.log('======================================================\n');
