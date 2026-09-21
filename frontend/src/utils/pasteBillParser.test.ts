import { parsePastedBillText } from './pasteBillParser.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

console.log('--- Starting Clipboard Bill Parser Tests ---');

// TEST 1: Multiple bills with "Kl" at the end
{
  const input = `147+3+2\n424+3+2\n442+3+2\n750+3+2\nKl`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 1: parsePastedBillText should succeed');
  // 4 bills, each produces 1 Direct and 1 Shuffle (Box) => 8 items
  assert(res.items.length === 8, `Test 1: expected 8 items, got ${res.items.length}`);
  const numbers = res.items.map((it) => it.number);
  assert(numbers.includes('147'), 'Test 1: includes 147');
  assert(numbers.includes('424'), 'Test 1: includes 424');
  assert(numbers.includes('442'), 'Test 1: includes 442');
  assert(numbers.includes('750'), 'Test 1: includes 750');
  console.log('✓ Test 1 Passed: 4 bills imported, Kl ignored');
}

// TEST 2: 1 bill followed by KL, Hello, Dear
{
  const input = `147+3+2\nKL\nHello\nDear`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 2: should succeed');
  assert(res.items.length === 2, `Test 2: expected 2 items, got ${res.items.length}`);
  assert(res.items[0].number === '147' && res.items[0].type === 'Direct' && res.items[0].count === 3, 'Test 2: direct item');
  assert(res.items[1].number === '147' && res.items[1].type === 'Shuffle' && res.items[1].count === 2, 'Test 2: shuffle item');
  console.log('✓ Test 2 Passed: 147+3+2 imported, KL, Hello, Dear ignored');
}

// TEST 3: Unrelated text before, between, and after bills
{
  const input = `KL\n147+3+2\nRandom Text\n424+3+2\nXYZ`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 3: should succeed');
  assert(res.items.length === 4, `Test 3: expected 4 items, got ${res.items.length}`);
  assert(res.items.some((it) => it.number === '147'), 'Test 3: includes 147');
  assert(res.items.some((it) => it.number === '424'), 'Test 3: includes 424');
  console.log('✓ Test 3 Passed: 2 bills imported with unrelated text before, between, after');
}

// TEST 4: Box shorthand format using B/b
{
  const input = `546+15b\n546 10 B`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 4: should succeed');
  assert(res.items.length === 2, `Test 4: expected 2 items, got ${res.items.length}`);
  assert(res.items[0].number === '546' && res.items[0].type === 'Shuffle' && res.items[0].count === 15, 'Test 4: 546 Box 15');
  assert(res.items[1].number === '546' && res.items[1].type === 'Shuffle' && res.items[1].count === 10, 'Test 4: 546 Box 10');
  console.log('✓ Test 4 Passed: 546+15b and 546 10 B parsed as Box (Shuffle)');
}

// TEST 5: Box shorthand with unrelated text
{
  const input = `546+15b\nHello\n546 10 B\nKL`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 5: should succeed');
  assert(res.items.length === 2, `Test 5: expected 2 items, got ${res.items.length}`);
  assert(res.items[0].number === '546' && res.items[0].count === 15 && res.items[0].type === 'Shuffle', 'Test 5: item 1');
  assert(res.items[1].number === '546' && res.items[1].count === 10 && res.items[1].type === 'Shuffle', 'Test 5: item 2');
  console.log('✓ Test 5 Passed: Box shorthand imported, Hello and KL ignored');
}

// TEST 6: Mixed formats (3-group, 2-group, box shorthand) with unrelated text
{
  const input = `638+1+1\nrandom text\n455-10\nKL\n546+15b`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 6: should succeed');
  // 638+1+1 -> 2 items (Direct 1, Shuffle 1)
  // 455-10 -> 1 item (Direct 10)
  // 546+15b -> 1 item (Shuffle 15)
  // Total = 4 items
  assert(res.items.length === 4, `Test 6: expected 4 items, got ${res.items.length}`);
  assert(res.items[0].number === '638' && res.items[0].type === 'Direct' && res.items[0].count === 1, 'Test 6: 638 Super 1');
  assert(res.items[1].number === '638' && res.items[1].type === 'Shuffle' && res.items[1].count === 1, 'Test 6: 638 Box 1');
  assert(res.items[2].number === '455' && res.items[2].type === 'Direct' && res.items[2].count === 10, 'Test 6: 455 Super 10');
  assert(res.items[3].number === '546' && res.items[3].type === 'Shuffle' && res.items[3].count === 15, 'Test 6: 546 Box 15');
  console.log('✓ Test 6 Passed: Mixed 3-group, 2-group, and box shorthand imported, random text and KL ignored');
}

// TEST 7: Existing position formats with unrelated text
{
  const input = `ABC*8*15\nHello\nA*6*50\nRandom\nAB*45*10`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 7: should succeed');
  // ABC*8*15 -> 3 items (A:8, B:8, C:8)
  // A*6*50 -> 1 item (A:6)
  // AB*45*10 -> 1 item (AB:45)
  // Total = 5 items
  assert(res.items.length === 5, `Test 7: expected 5 items, got ${res.items.length}`);
  assert(res.items[0].number === 'A:8' && res.items[0].count === 15, 'Test 7: A:8');
  assert(res.items[1].number === 'B:8' && res.items[1].count === 15, 'Test 7: B:8');
  assert(res.items[2].number === 'C:8' && res.items[2].count === 15, 'Test 7: C:8');
  assert(res.items[3].number === 'A:6' && res.items[3].count === 50, 'Test 7: A:6');
  assert(res.items[4].number === 'AB:45' && res.items[4].count === 10, 'Test 7: AB:45');
  console.log('✓ Test 7 Passed: Position formats preserved, unrelated text ignored');
}

// TEST 8: Case-insensitivity & variations of Box shorthand
{
  const input = `546+15b\n546+15B\n546 10 B\n546 10 b\n546-15-b\n546=15B\n546 15B\n546 B 10\n546 b 10`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 8: should succeed');
  assert(res.items.length === 9, `Test 8: expected 9 items, got ${res.items.length}`);
  res.items.forEach((it, idx) => {
    assert(it.number === '546', `Test 8 [${idx}]: number 546`);
    assert(it.type === 'Shuffle', `Test 8 [${idx}]: type Shuffle`);
  });
  console.log('✓ Test 8 Passed: Box shorthand works across b, B, spaces, dashes, equals, and prefix notation');
}

// TEST 9: B in random text must NOT become a bill
{
  const input = `Hello B\nRandom B text\nB\n147+3+2 KL`;
  const res = parsePastedBillText(input);
  // None of these lines are valid bills; "147+3+2 KL" is not a valid bill pattern (letters cannot be blindly stripped)
  assert(res.success === false, 'Test 9: should fail because no valid bills exist');
  assert(res.items.length === 0, 'Test 9: items should be empty');
  console.log('✓ Test 9 Passed: Random text containing B and "147+3+2 KL" do NOT become bills');
}

// TEST 10: Position B format preserved without conflict with Box shorthand
{
  const input = `B*3*30\nB 3 30\nB-3-30\n546 10 B`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 10: should succeed');
  assert(res.items.length === 4, `Test 10: expected 4 items, got ${res.items.length}`);
  // First 3 are Position B
  assert(res.items[0].number === 'B:3' && res.items[0].type === 'Position' && res.items[0].count === 30, 'Test 10: B*3*30');
  assert(res.items[1].number === 'B:3' && res.items[1].type === 'Position' && res.items[1].count === 30, 'Test 10: B 3 30');
  assert(res.items[2].number === 'B:3' && res.items[2].type === 'Position' && res.items[2].count === 30, 'Test 10: B-3-30');
  // 4th is Box shorthand
  assert(res.items[3].number === '546' && res.items[3].type === 'Shuffle' && res.items[3].count === 10, 'Test 10: 546 Box 10');
  console.log('✓ Test 10 Passed: Position B and Box shorthand B co-exist without conflict');
}

// TEST 11: All existing flexible separators
{
  const separators = ['+', '-', '=', '/', ':', '_', '@', '#', '$', '%', '&', '|', '~', ' '];
  for (const sep of separators) {
    const input = `638${sep}1${sep}1`;
    const res = parsePastedBillText(input);
    assert(res.success === true, `Test 11 [sep '${sep}']: should succeed`);
    assert(res.items.length === 2, `Test 11 [sep '${sep}']: expected 2 items`);
    assert(res.items[0].number === '638' && res.items[0].type === 'Direct' && res.items[0].count === 1, `Test 11 [sep '${sep}']: direct`);
    assert(res.items[1].number === '638' && res.items[1].type === 'Shuffle' && res.items[1].count === 1, `Test 11 [sep '${sep}']: shuffle`);
  }
  // Mixed separators
  const mixed = ['638-3+2', '638+3=2', '638/3-2', '638 @ 3 # 2'];
  for (const m of mixed) {
    const res = parsePastedBillText(m);
    assert(res.success === true, `Test 11 [mixed '${m}']: should succeed`);
    assert(res.items.length === 2, `Test 11 [mixed '${m}']: expected 2 items`);
    assert(res.items[0].count === 3 && res.items[1].count === 2, `Test 11 [mixed '${m}']: counts 3 and 2`);
  }
  console.log('✓ Test 11 Passed: All flexible and mixed separators supported');
}

// TEST 12: Existing 2-group Super format (Number + Super)
{
  const input = `455-10\n455=10\n455/10\n455 10`;
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 12: should succeed');
  assert(res.items.length === 4, `Test 12: expected 4 items, got ${res.items.length}`);
  res.items.forEach((it, idx) => {
    assert(it.number === '455', `Test 12 [${idx}]: number 455`);
    assert(it.type === 'Direct', `Test 12 [${idx}]: type Direct (Super)`);
    assert(it.count === 10, `Test 12 [${idx}]: count 10`);
  });
  console.log('✓ Test 12 Passed: Existing 2-group Super format works across -, =, /, space');
}

// TEST 13: Pure invalid text / only unrelated text
{
  const input = `KL\nHello\nDear\nSome Random Text\nXYZ`;
  const res = parsePastedBillText(input);
  assert(res.success === false, 'Test 13: should return success false');
  assert(res.errorMessage === 'No valid bill lines found.', 'Test 13: error message');
  console.log('✓ Test 13 Passed: Pure invalid text produces "No valid bill lines found." error');
}

// TEST 14: Empty clipboard
{
  const res = parsePastedBillText('   \n  \n  ');
  assert(res.success === false, 'Test 14: should return success false');
  assert(res.errorMessage === 'Please enter or paste at least one bill line.', 'Test 14: empty message');
  console.log('✓ Test 14 Passed: Empty clipboard handled');
}

// TEST 15: NUMBER + BOX standard 3-digit bills
{
  const lines = [
    '024-1box',
    '029-1box',
    '074-1box',
    '079-1box',
    '524-1box',
    '529-1box',
    '574-1box',
    '579-1box',
  ];
  const input = lines.join('\n');
  const res = parsePastedBillText(input);
  assert(res.success === true, 'Test 15: should succeed');
  assert(res.items.length === 8, `Test 15: expected 8 items, got ${res.items.length}`);
  const expectedNums = ['024', '029', '074', '079', '524', '529', '574', '579'];
  res.items.forEach((it, idx) => {
    assert(it.number === expectedNums[idx], `Test 15 [${idx}]: expected number ${expectedNums[idx]}, got ${it.number}`);
    assert(it.type === 'Shuffle', `Test 15 [${idx}]: expected type Shuffle (Box), got ${it.type}`);
    assert(it.count === 1, `Test 15 [${idx}]: expected count 1, got ${it.count}`);
    assert(it.totalAmount === 10, `Test 15 [${idx}]: expected amount 10, got ${it.totalAmount}`);
  });
  console.log('✓ Test 15 Passed: 8 Number + Box bills parsed, leading zeros preserved');
}

// TEST 16: Different Box counts and separators
{
  const cases: [string, string, number][] = [
    ['024-2box', '024', 2],
    ['024-10box', '024', 10],
    ['024-25box', '024', 25],
    ['024-100box', '024', 100],
    ['024=2box', '024', 2],
    ['024+10box', '024', 10],
    ['024/25box', '024', 25],
    ['024:100box', '024', 100],
    ['024..10box', '024', 10],
    ['024 25 box', '024', 25],
  ];
  for (const [inp, expNum, expCount] of cases) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 16 [${inp}]: should succeed`);
    assert(res.items.length === 1, `Test 16 [${inp}]: expected 1 item`);
    assert(res.items[0].number === expNum, `Test 16 [${inp}]: expected number ${expNum}, got ${res.items[0].number}`);
    assert(res.items[0].type === 'Shuffle', `Test 16 [${inp}]: expected Shuffle`);
    assert(res.items[0].count === expCount, `Test 16 [${inp}]: expected count ${expCount}, got ${res.items[0].count}`);
    assert(res.items[0].totalAmount === expCount * 10, `Test 16 [${inp}]: expected amount ${expCount * 10}`);
  }
  console.log('✓ Test 16 Passed: Variable Box counts (2, 10, 25, 100) and various separators parsed correctly');
}

// TEST 17: Case-insensitivity of "box"
{
  const cases = [
    '024-1box',
    '024-1Box',
    '024-1BOX',
    '024=1BOX',
    '024+2Box',
    '024..10BOX',
    '024 25 box',
  ];
  for (const inp of cases) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 17 [${inp}]: should succeed`);
    assert(res.items.length === 1, `Test 17 [${inp}]: expected 1 item`);
    assert(res.items[0].number === '024', `Test 17 [${inp}]: expected 024`);
    assert(res.items[0].type === 'Shuffle', `Test 17 [${inp}]: expected Shuffle`);
  }
  console.log('✓ Test 17 Passed: "box", "Box", "BOX" are fully case-insensitive');
}

// TEST 18: Flexible separators for Number + Box
{
  const separators = ['-', '=', '+', '/', ':', '_', '@', '#', '$', '%', '&', '|', '~', '.', '..'];
  for (const sep of separators) {
    const inp = `024${sep}1box`;
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 18 [sep '${sep}']: should succeed`);
    assert(res.items.length === 1, `Test 18 [sep '${sep}']: expected 1 item`);
    assert(res.items[0].number === '024', `Test 18 [sep '${sep}']: expected number 024`);
    assert(res.items[0].type === 'Shuffle', `Test 18 [sep '${sep}']: expected Shuffle`);
    assert(res.items[0].count === 1, `Test 18 [sep '${sep}']: expected count 1`);
  }
  console.log('✓ Test 18 Passed: Flexible separators (-, =, +, /, :, _, @, #, $, %, &, |, ~, ., ..) all work');
}

// TEST 19: Whitespace variations for Number + Box
{
  const whitespaceCases = [
    '024 1box',
    '024 1 box',
    '024 - 1box',
    '024 -1box',
    '024- 1box',
    '024 - 1 box',
  ];
  for (const inp of whitespaceCases) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 19 [${inp}]: should succeed`);
    assert(res.items.length === 1, `Test 19 [${inp}]: expected 1 item`);
    assert(res.items[0].number === '024', `Test 19 [${inp}]: expected number 024`);
    assert(res.items[0].type === 'Shuffle', `Test 19 [${inp}]: expected Shuffle`);
    assert(res.items[0].count === 1, `Test 19 [${inp}]: expected count 1`);
  }
  console.log('✓ Test 19 Passed: Whitespace variations between number, count, and box supported');
}

// TEST 20: Preservation of leading zeros
{
  const res1 = parsePastedBillText('024-1box');
  assert(res1.items[0].number === '024', 'Test 20: 024 preserved as string "024"');
  const res2 = parsePastedBillText('029-1box');
  assert(res2.items[0].number === '029', 'Test 20: 029 preserved as string "029"');
  const res3 = parsePastedBillText('074-1box');
  assert(res3.items[0].number === '074', 'Test 20: 074 preserved as string "074"');
  const res4 = parsePastedBillText('079-1box');
  assert(res4.items[0].number === '079', 'Test 20: 079 preserved as string "079"');
  console.log('✓ Test 20 Passed: Leading zeros strictly preserved as strings');
}

// TEST 21: Single and multiple dot separators
{
  const dotCases: [string, string, number][] = [
    ['134.1box', '134', 1],
    ['134..1box', '134', 1],
    ['139.1box', '139', 1],
    ['139..1box', '139', 1],
    ['184.1box', '184', 1],
    ['184..1box', '184', 1],
    ['189.1box', '189', 1],
    ['189..1box', '189', 1],
    ['634.1box', '634', 1],
    ['634..1box', '634', 1],
    ['639.1box', '639', 1],
    ['639..1box', '639', 1],
    ['684.1box', '684', 1],
    ['684..1box', '684', 1],
    ['689.1box', '689', 1],
    ['689..1box', '689', 1],
    ['134..2box', '134', 2],
    ['134..10box', '134', 10],
    ['134..25box', '134', 25],
  ];
  for (const [inp, expNum, expCount] of dotCases) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 21 [${inp}]: should succeed`);
    assert(res.items.length === 1, `Test 21 [${inp}]: expected 1 item`);
    assert(res.items[0].number === expNum, `Test 21 [${inp}]: expected number ${expNum}, got ${res.items[0].number}`);
    assert(res.items[0].type === 'Shuffle', `Test 21 [${inp}]: expected Shuffle`);
    assert(res.items[0].count === expCount, `Test 21 [${inp}]: expected count ${expCount}`);
  }
  console.log('✓ Test 21 Passed: Single dot and multiple dots (. and ..) handled seamlessly');
}

// TEST 22: ABC Number + Count format (A, B, C positions, NOT Super & Box)
{
  const cases = [
    'ABC 5 10',
    'Abc 5 10',
    'abc 5 10',
    'aBc 5 10',
    'ABc 5 10',
    'ABC-5-10',
    'ABC=5=10',
    'ABC+5+10',
    'ABC/5/10',
    'ABC:5:10',
    'ABC_5_10',
    'ABC@5@10',
    'ABC#5#10',
    'ABC$5$10',
    'ABC%5%10',
    'ABC&5&10',
    'ABC|5|10',
    'ABC~5~10',
    'ABC.5.10',
    'ABC..5..10',
    'aBc..5..10',
    'ABC  5  10',
    'ABC - 5 - 10',
    'Abc . 5 . 10',
  ];
  for (const inp of cases) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 22 [${inp}]: should succeed`);
    assert(res.items.length === 3, `Test 22 [${inp}]: expected 3 items (A, B, C positions), got ${res.items.length}`);
    assert(res.items[0].number === 'A:5' && res.items[0].count === 10 && res.items[0].type === 'Position', `Test 22 [${inp}]: A:5`);
    assert(res.items[1].number === 'B:5' && res.items[1].count === 10 && res.items[1].type === 'Position', `Test 22 [${inp}]: B:5`);
    assert(res.items[2].number === 'C:5' && res.items[2].count === 10 && res.items[2].type === 'Position', `Test 22 [${inp}]: C:5`);
    // Specifically verify ABC 5 10 does NOT create Super = 5, Box = 10
    const hasSuper = res.items.some((it) => it.type === 'Direct');
    const hasBox = res.items.some((it) => it.type === 'Shuffle');
    assert(!hasSuper && !hasBox, `Test 22 [${inp}]: must NOT create Super or Box`);
  }
  console.log('✓ Test 22 Passed: ABC Number + Count with flexible separators correctly maps to A, B, C positions (NOT Super & Box)');
}

// TEST 23: AB + AC + BC Combined format
{
  const combined79Cases = [
    'AB. AC. BC.. 79..2',
    'Ab. Ac. Bc.. 79..2',
    'ab. ac. bc.. 79..2',
    'aB. aC. bC.. 79..2',
    'ab..ac..bc..79..2',
    'AB . AC . BC .. 79 .. 2',
  ];
  for (const inp of combined79Cases) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 23 [${inp}]: should succeed`);
    assert(res.items.length === 3, `Test 23 [${inp}]: expected 3 items (AB, AC, BC)`);
    assert(res.items[0].number === 'AB:79' && res.items[0].count === 2 && res.items[0].type === 'Pair', `Test 23 [${inp}]: AB:79`);
    assert(res.items[1].number === 'AC:79' && res.items[1].count === 2 && res.items[1].type === 'Pair', `Test 23 [${inp}]: AC:79`);
    assert(res.items[2].number === 'BC:79' && res.items[2].count === 2 && res.items[2].type === 'Pair', `Test 23 [${inp}]: BC:79`);
  }

  const combined97Cases = [
    'AB. AC. BC.. 97..2',
    'Ab. Ac. Bc.. 97..2',
    'ab. ac. bc.. 97..2',
    'AB..AC..BC..97..2',
  ];
  for (const inp of combined97Cases) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 23 [${inp}]: should succeed`);
    assert(res.items.length === 3, `Test 23 [${inp}]: expected 3 items (AB, AC, BC)`);
    assert(res.items[0].number === 'AB:97' && res.items[0].count === 2 && res.items[0].type === 'Pair', `Test 23 [${inp}]: AB:97`);
    assert(res.items[1].number === 'AC:97' && res.items[1].count === 2 && res.items[1].type === 'Pair', `Test 23 [${inp}]: AC:97`);
    assert(res.items[2].number === 'BC:97' && res.items[2].count === 2 && res.items[2].type === 'Pair', `Test 23 [${inp}]: BC:97`);
  }
  console.log('✓ Test 23 Passed: Combined AB + AC + BC with single/multiple dots and case variations parsed correctly');
}

// TEST 24: Existing numeric and special formats continue working
{
  const existingCases: [string, { num: string; count: number; type: string }[]][] = [
    ['305=2=2', [{ num: '305', count: 2, type: 'Direct' }, { num: '305', count: 2, type: 'Shuffle' }]],
    ['536=2=2', [{ num: '536', count: 2, type: 'Direct' }, { num: '536', count: 2, type: 'Shuffle' }]],
    ['638*3+2', [{ num: '638', count: 3, type: 'Direct' }, { num: '638', count: 2, type: 'Shuffle' }]],
    ['638*3', [{ num: '638', count: 3, type: 'Direct' }]],
    ['ABC*8*15', [{ num: 'A:8', count: 15, type: 'Position' }, { num: 'B:8', count: 15, type: 'Position' }, { num: 'C:8', count: 15, type: 'Position' }]],
    ['ALL*8*15', [{ num: 'A:8', count: 15, type: 'Position' }, { num: 'B:8', count: 15, type: 'Position' }, { num: 'C:8', count: 15, type: 'Position' }]],
    ['A*6*50', [{ num: 'A:6', count: 50, type: 'Position' }]],
    ['B*3*30', [{ num: 'B:3', count: 30, type: 'Position' }]],
    ['C*7*30', [{ num: 'C:7', count: 30, type: 'Position' }]],
    ['AB*45*10', [{ num: 'AB:45', count: 10, type: 'Pair' }]],
    ['BC*23*10', [{ num: 'BC:23', count: 10, type: 'Pair' }]],
    ['AC*89*10', [{ num: 'AC:89', count: 10, type: 'Pair' }]],
    ['928=2', [{ num: '928', count: 2, type: 'Direct' }]],
    ['546+15b', [{ num: '546', count: 15, type: 'Shuffle' }]],
    ['546+15B', [{ num: '546', count: 15, type: 'Shuffle' }]],
    ['546 10 B', [{ num: '546', count: 10, type: 'Shuffle' }]],
    ['546 10 b', [{ num: '546', count: 10, type: 'Shuffle' }]],
  ];
  for (const [inp, expItems] of existingCases) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 24 [${inp}]: should succeed`);
    assert(res.items.length === expItems.length, `Test 24 [${inp}]: expected ${expItems.length} items, got ${res.items.length}`);
    expItems.forEach((exp, idx) => {
      assert(res.items[idx].number === exp.num, `Test 24 [${inp}][${idx}]: expected num ${exp.num}, got ${res.items[idx].number}`);
      assert(res.items[idx].count === exp.count, `Test 24 [${inp}][${idx}]: expected count ${exp.count}, got ${res.items[idx].count}`);
      assert(res.items[idx].type === exp.type, `Test 24 [${inp}][${idx}]: expected type ${exp.type}, got ${res.items[idx].type}`);
    });
  }
  console.log('✓ Test 24 Passed: All 17 existing numeric and special formats continue working identically');
}

// TEST 25: Strict Number-Box validation (invalid inputs ignored / rejected)
{
  const invalidInputs = [
    'Hello',
    'Hello B',
    'Random B',
    'random 1box',
    'abc 1box',
    '123abc',
    '1box',
    '12-1box',
    '1234-1box',
  ];
  for (const inv of invalidInputs) {
    const res = parsePastedBillText(inv);
    assert(res.success === false, `Test 25: "${inv}" must NOT be recognized as a valid bill`);
    assert(res.items.length === 0, `Test 25: items must be empty for "${inv}"`);
  }
  console.log('✓ Test 25 Passed: Strict validation rejects 1box, 12-1box, 1234-1box, abc 1box, random 1box, etc.');
}

// TEST 26: Complete Section 24 Mixed Clipboard Test
{
  const mixedInput = `024-1box
Hello
029=2box
305=2=2
random text
Abc 5 10
074..10box
Ab. Ac. Bc.. 79..2
Kerala
638*3+2
634..1BOX
AB. AC. BC.. 97..2
some random sentence
579 - 30 box`;

  const res = parsePastedBillText(mixedInput);
  assert(res.success === true, 'Test 26: Mixed clipboard parsing should succeed');

  // Breakdown of expected items:
  // 1. 024-1box -> 1 item (024 Box 1)
  // [Hello ignored]
  // 2. 029=2box -> 1 item (029 Box 2)
  // 3. 305=2=2 -> 2 items (305 Super 2, 305 Box 2)
  // [random text ignored]
  // 4. Abc 5 10 -> 3 items (A:5 10, B:5 10, C:5 10)
  // 5. 074..10box -> 1 item (074 Box 10)
  // 6. Ab. Ac. Bc.. 79..2 -> 3 items (AB:79 2, AC:79 2, BC:79 2)
  // [Kerala ignored]
  // 7. 638*3+2 -> 2 items (638 Super 3, 638 Box 2)
  // 8. 634..1BOX -> 1 item (634 Box 1)
  // 9. AB. AC. BC.. 97..2 -> 3 items (AB:97 2, AC:97 2, BC:97 2)
  // [some random sentence ignored]
  // 10. 579 - 30 box -> 1 item (579 Box 30)
  // Total expected = 1 + 1 + 2 + 3 + 1 + 3 + 2 + 1 + 3 + 1 = 18 items
  assert(res.items.length === 18, `Test 26: expected 18 items, got ${res.items.length}`);

  // Check items in order:
  // 1: 024-1box
  assert(res.items[0].number === '024' && res.items[0].count === 1 && res.items[0].type === 'Shuffle', 'Item 0: 024 Box 1');
  // 2: 029=2box
  assert(res.items[1].number === '029' && res.items[1].count === 2 && res.items[1].type === 'Shuffle', 'Item 1: 029 Box 2');
  // 3: 305=2=2
  assert(res.items[2].number === '305' && res.items[2].count === 2 && res.items[2].type === 'Direct', 'Item 2: 305 Super 2');
  assert(res.items[3].number === '305' && res.items[3].count === 2 && res.items[3].type === 'Shuffle', 'Item 3: 305 Box 2');
  // 4: Abc 5 10
  assert(res.items[4].number === 'A:5' && res.items[4].count === 10 && res.items[4].type === 'Position', 'Item 4: A:5 10');
  assert(res.items[5].number === 'B:5' && res.items[5].count === 10 && res.items[5].type === 'Position', 'Item 5: B:5 10');
  assert(res.items[6].number === 'C:5' && res.items[6].count === 10 && res.items[6].type === 'Position', 'Item 6: C:5 10');
  // 5: 074..10box
  assert(res.items[7].number === '074' && res.items[7].count === 10 && res.items[7].type === 'Shuffle', 'Item 7: 074 Box 10');
  // 6: Ab. Ac. Bc.. 79..2
  assert(res.items[8].number === 'AB:79' && res.items[8].count === 2 && res.items[8].type === 'Pair', 'Item 8: AB:79 2');
  assert(res.items[9].number === 'AC:79' && res.items[9].count === 2 && res.items[9].type === 'Pair', 'Item 9: AC:79 2');
  assert(res.items[10].number === 'BC:79' && res.items[10].count === 2 && res.items[10].type === 'Pair', 'Item 10: BC:79 2');
  // 7: 638*3+2
  assert(res.items[11].number === '638' && res.items[11].count === 3 && res.items[11].type === 'Direct', 'Item 11: 638 Super 3');
  assert(res.items[12].number === '638' && res.items[12].count === 2 && res.items[12].type === 'Shuffle', 'Item 12: 638 Box 2');
  // 8: 634..1BOX
  assert(res.items[13].number === '634' && res.items[13].count === 1 && res.items[13].type === 'Shuffle', 'Item 13: 634 Box 1');
  // 9: AB. AC. BC.. 97..2
  assert(res.items[14].number === 'AB:97' && res.items[14].count === 2 && res.items[14].type === 'Pair', 'Item 14: AB:97 2');
  assert(res.items[15].number === 'AC:97' && res.items[15].count === 2 && res.items[15].type === 'Pair', 'Item 15: AC:97 2');
  assert(res.items[16].number === 'BC:97' && res.items[16].count === 2 && res.items[16].type === 'Pair', 'Item 16: BC:97 2');
  // 10: 579 - 30 box
  assert(res.items[17].number === '579' && res.items[17].count === 30 && res.items[17].type === 'Shuffle', 'Item 17: 579 Box 30');

  console.log('✓ Test 26 Passed: Complete Section 24 mixed clipboard parsed with 100% precision (18 items, 5 unrelated lines ignored, leading zeros preserved)');
}

// TEST 27: Multiple 3-digit numbers followed by one Super count
{
  // 1. Flexible separators producing: 088, 789, 432, 687, 819 each Super 1
  const sepInputs = [
    '088.789.432.687.819-1',
    '088-789-432-687-819-1',
    '088=789=432=687=819=1',
    '088+789+432+687+819+1',
    '088/789/432/687/819/1',
    '088:789:432:687:819:1',
    '088_789_432_687_819-1',
    '088@789#432$687%819-1',
    '088.789.432.687.819.1',
    '088..789..432..687..819-1',
    '088 789 432 687 819 1',
  ];

  for (const inp of sepInputs) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 27: "${inp}" should succeed`);
    assert(res.items.length === 5, `Test 27: "${inp}" should produce 5 items, got ${res.items.length}`);
    const expectedNumbers = ['088', '789', '432', '687', '819'];
    for (let i = 0; i < 5; i++) {
      assert(res.items[i].number === expectedNumbers[i], `Test 27: item ${i} number should be ${expectedNumbers[i]}, got ${res.items[i].number}`);
      assert(res.items[i].type === 'Direct', `Test 27: item ${i} type should be Direct`);
      assert(res.items[i].count === 1, `Test 27: item ${i} count should be 1`);
      assert(res.items[i].unitPrice === 10, `Test 27: item ${i} unitPrice should be 10`);
      assert(res.items[i].totalAmount === 10, `Test 27: item ${i} totalAmount should be 10`);
    }
  }

  // 2. Variable number of numbers: 1, 2, 3, 5 numbers
  {
    // Single number: 088-1
    const res1 = parsePastedBillText('088-1');
    assert(res1.success === true && res1.items.length === 1, 'Test 27: 088-1 should produce 1 item');
    assert(res1.items[0].number === '088' && res1.items[0].type === 'Direct' && res1.items[0].count === 1, 'Test 27: 088 Super 1');

    // Two numbers: 088.789-1
    const res2 = parsePastedBillText('088.789-1');
    assert(res2.success === true && res2.items.length === 2, 'Test 27: 088.789-1 should produce 2 items');
    assert(res2.items[0].number === '088' && res2.items[0].count === 1 && res2.items[0].type === 'Direct', 'Test 27: 088 Super 1');
    assert(res2.items[1].number === '789' && res2.items[1].count === 1 && res2.items[1].type === 'Direct', 'Test 27: 789 Super 1');

    // Three numbers: 088.789.432-1
    const res3 = parsePastedBillText('088.789.432-1');
    assert(res3.success === true && res3.items.length === 3, 'Test 27: 088.789.432-1 should produce 3 items');
    assert(res3.items[0].number === '088' && res3.items[0].count === 1, 'Test 27: 088 Super 1');
    assert(res3.items[1].number === '789' && res3.items[1].count === 1, 'Test 27: 789 Super 1');
    assert(res3.items[2].number === '432' && res3.items[2].count === 1, 'Test 27: 432 Super 1');
  }

  // 3. Variable counts: Count = 2, Count = 10
  {
    // 088.789.432-2 -> each Super 2
    const resCount2 = parsePastedBillText('088.789.432-2');
    assert(resCount2.success === true && resCount2.items.length === 3, 'Test 27: 088.789.432-2 should produce 3 items');
    assert(resCount2.items.every((it) => it.count === 2 && it.type === 'Direct' && it.totalAmount === 20), 'Test 27: each Super 2');

    // 088.789.432.687-10 -> each Super 10
    const resCount10 = parsePastedBillText('088.789.432.687-10');
    assert(resCount10.success === true && resCount10.items.length === 4, 'Test 27: 088.789.432.687-10 should produce 4 items');
    assert(resCount10.items.every((it) => it.count === 10 && it.type === 'Direct' && it.totalAmount === 100), 'Test 27: each Super 10');
    assert(resCount10.items[0].number === '088', 'Test 27: first number is 088');
    assert(resCount10.items[1].number === '789', 'Test 27: second number is 789');
    assert(resCount10.items[2].number === '432', 'Test 27: third number is 432');
    assert(resCount10.items[3].number === '687', 'Test 27: fourth number is 687');
  }

  // 4. Leading zeros strictly preserved
  {
    const zeroRes = parsePastedBillText('001.007.012.099-5');
    assert(zeroRes.success === true && zeroRes.items.length === 4, 'Test 27: leading zeros line should succeed');
    assert(zeroRes.items[0].number === '001' && zeroRes.items[0].count === 5, 'Test 27: 001 preserved');
    assert(zeroRes.items[1].number === '007' && zeroRes.items[1].count === 5, 'Test 27: 007 preserved');
    assert(zeroRes.items[2].number === '012' && zeroRes.items[2].count === 5, 'Test 27: 012 preserved');
    assert(zeroRes.items[3].number === '099' && zeroRes.items[3].count === 5, 'Test 27: 099 preserved');
  }

  // 5. Existing format 305=2=2 retains Super 2, Box 2
  {
    const res305 = parsePastedBillText('305=2=2');
    assert(res305.success === true && res305.items.length === 2, 'Test 27: 305=2=2 retains 2 items');
    assert(res305.items[0].number === '305' && res305.items[0].type === 'Direct' && res305.items[0].count === 2, '305 Super 2');
    assert(res305.items[1].number === '305' && res305.items[1].type === 'Shuffle' && res305.items[1].count === 2, '305 Box 2');
  }

  console.log('✓ Test 27 Passed: Multiple 3-digit numbers + one Super count parsed across all separators, counts, and leading zeroes');
}

// TEST 28: X / x as a multiplication separator
{
  // 1. Mixed separators with x / X: Number 513, Super 10, Box 2
  const mixedXInputs = [
    '513=10x2',
    '513=10X2',
    '513-10x2',
    '513-10X2',
    '513.10x2',
    '513..10X2',
    '513 10x2',
    '513.10X2',
  ];

  for (const inp of mixedXInputs) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 28: "${inp}" should succeed`);
    assert(res.items.length === 2, `Test 28: "${inp}" should produce 2 items, got ${res.items.length}`);
    assert(res.items[0].number === '513' && res.items[0].type === 'Direct' && res.items[0].count === 10, `Test 28: "${inp}" Direct 10`);
    assert(res.items[1].number === '513' && res.items[1].type === 'Shuffle' && res.items[1].count === 2, `Test 28: "${inp}" Shuffle 2`);
  }

  // 2. Pure x / X forms working identically to 513*10*2
  const pureXInputs = [
    '513x10x2',
    '513X10X2',
    '513x10X2',
    '513X10x2',
  ];

  for (const inp of pureXInputs) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 28: "${inp}" should succeed`);
    assert(res.items.length === 2, `Test 28: "${inp}" should produce 2 items, got ${res.items.length}`);
    assert(res.items[0].number === '513' && res.items[0].type === 'Direct' && res.items[0].count === 10, `Test 28: "${inp}" Direct 10`);
    assert(res.items[1].number === '513' && res.items[1].type === 'Shuffle' && res.items[1].count === 2, `Test 28: "${inp}" Shuffle 2`);
  }

  // 3. 2-Group forms with x / X
  const twoGroupX = ['513x10', '513X10', '513 x 10'];
  for (const inp of twoGroupX) {
    const res = parsePastedBillText(inp);
    assert(res.success === true, `Test 28: "${inp}" should succeed`);
    assert(res.items.length === 1, `Test 28: "${inp}" should produce 1 item`);
    assert(res.items[0].number === '513' && res.items[0].type === 'Direct' && res.items[0].count === 10, `Test 28: "${inp}" Direct 10`);
  }

  // 4. Arbitrary text containing x must NOT become a bill
  const invalidXText = [
    'Hello x',
    'example',
    'text x 10',
    'Random x',
  ];
  for (const inv of invalidXText) {
    const res = parsePastedBillText(inv);
    assert(res.success === false, `Test 28: "${inv}" must NOT be recognized as a valid bill`);
    assert(res.items.length === 0, `Test 28: "${inv}" items should be empty`);
  }

  console.log('✓ Test 28 Passed: x and X function as valid multiplication separators like * in mixed and pure formats; arbitrary text rejected');
}

// TEST 29: AB / AC / BC + Multiple Numbers + Count
{
  // 1. Primary test cases: AB, AC (with trailing dot), BC
  {
    const resAB = parsePastedBillText('AB.79..89.73.37.1');
    assert(resAB.success === true, 'Test 29: AB.79..89.73.37.1 should succeed');
    assert(resAB.items.length === 4, `Test 29: expected 4 items, got ${resAB.items.length}`);
    const expected = ['AB:79', 'AB:89', 'AB:73', 'AB:37'];
    for (let i = 0; i < 4; i++) {
      assert(resAB.items[i].number === expected[i], `AB item ${i} number ${expected[i]}`);
      assert(resAB.items[i].count === 1, `AB item ${i} count 1`);
      assert(resAB.items[i].type === 'Pair', `AB item ${i} type Pair`);
      assert(resAB.items[i].unitPrice === 10, `AB item ${i} unitPrice 10`);
      assert(resAB.items[i].totalAmount === 10, `AB item ${i} totalAmount 10`);
    }

    // Trailing dot: AC.79.89.73.37.1.
    const resAC = parsePastedBillText('AC.79.89.73.37.1.');
    assert(resAC.success === true, 'Test 29: AC.79.89.73.37.1. should succeed');
    assert(resAC.items.length === 4, `Test 29: expected 4 items, got ${resAC.items.length}`);
    const expectedAC = ['AC:79', 'AC:89', 'AC:73', 'AC:37'];
    for (let i = 0; i < 4; i++) {
      assert(resAC.items[i].number === expectedAC[i], `AC item ${i} number ${expectedAC[i]}`);
      assert(resAC.items[i].count === 1, `AC item ${i} count 1`);
      assert(resAC.items[i].type === 'Pair', `AC item ${i} type Pair`);
    }

    // Double dots: BC..79..89.73.37.1
    const resBC = parsePastedBillText('BC..79..89.73.37.1');
    assert(resBC.success === true, 'Test 29: BC..79..89.73.37.1 should succeed');
    assert(resBC.items.length === 4, `Test 29: expected 4 items, got ${resBC.items.length}`);
    const expectedBC = ['BC:79', 'BC:89', 'BC:73', 'BC:37'];
    for (let i = 0; i < 4; i++) {
      assert(resBC.items[i].number === expectedBC[i], `BC item ${i} number ${expectedBC[i]}`);
      assert(resBC.items[i].count === 1, `BC item ${i} count 1`);
      assert(resBC.items[i].type === 'Pair', `BC item ${i} type Pair`);
    }
  }

  // 2. Case-insensitivity: AB, Ab, aB, ab; AC, Ac, aC, ac; BC, Bc, bC, bc
  {
    const caseAB = ['AB.79..89.73.37.1', 'Ab.79..89.73.37.1', 'aB.79..89.73.37.1', 'ab.79..89.73.37.1'];
    for (const inp of caseAB) {
      const res = parsePastedBillText(inp);
      assert(res.success === true, `Test 29 case: "${inp}" should succeed`);
      assert(res.items.every((it) => it.number.startsWith('AB:')), `Test 29: "${inp}" must normalize to AB`);
    }

    const caseAC = ['AC.79.89.73.37.1', 'Ac.79.89.73.37.1', 'aC.79.89.73.37.1', 'ac.79.89.73.37.1'];
    for (const inp of caseAC) {
      const res = parsePastedBillText(inp);
      assert(res.success === true, `Test 29 case: "${inp}" should succeed`);
      assert(res.items.every((it) => it.number.startsWith('AC:')), `Test 29: "${inp}" must normalize to AC`);
    }

    const caseBC = ['BC..79..89.73.37.1', 'Bc..79..89.73.37.1', 'bC..79..89.73.37.1', 'bc..79..89.73.37.1'];
    for (const inp of caseBC) {
      const res = parsePastedBillText(inp);
      assert(res.success === true, `Test 29 case: "${inp}" should succeed`);
      assert(res.items.every((it) => it.number.startsWith('BC:')), `Test 29: "${inp}" must normalize to BC`);
    }
  }

  // 3. Flexible dots
  {
    const dotInputs = [
      'AB.79.89.73.37.1',
      'AB..79..89..73..37..1',
      'Ab.79..89.73.37.1',
      'ab..79..89..73..37..1',
    ];
    for (const inp of dotInputs) {
      const res = parsePastedBillText(inp);
      assert(res.success === true, `Test 29 dot: "${inp}" should succeed`);
      assert(res.items.length === 4, `Test 29 dot: "${inp}" expected 4 items, got ${res.items.length}`);
    }
  }

  // 4. Variable number of numbers: 1, 2, 3 numbers
  {
    // AB.79.1
    const res1 = parsePastedBillText('AB.79.1');
    assert(res1.success === true && res1.items.length === 1, 'Test 29: AB.79.1 should produce 1 item');
    assert(res1.items[0].number === 'AB:79' && res1.items[0].count === 1, 'AB:79 count 1');

    // AB.79.89.1
    const res2 = parsePastedBillText('AB.79.89.1');
    assert(res2.success === true && res2.items.length === 2, 'Test 29: AB.79.89.1 should produce 2 items');
    assert(res2.items[0].number === 'AB:79' && res2.items[0].count === 1, 'AB:79 count 1');
    assert(res2.items[1].number === 'AB:89' && res2.items[1].count === 1, 'AB:89 count 1');

    // AB.79.89.73.1
    const res3 = parsePastedBillText('AB.79.89.73.1');
    assert(res3.success === true && res3.items.length === 3, 'Test 29: AB.79.89.73.1 should produce 3 items');
    assert(res3.items[0].number === 'AB:79' && res3.items[0].count === 1, 'AB:79 count 1');
    assert(res3.items[1].number === 'AB:89' && res3.items[1].count === 1, 'AB:89 count 1');
    assert(res3.items[2].number === 'AB:73' && res3.items[2].count === 1, 'AB:73 count 1');
  }

  // 5. Different counts: count 5, count 10
  {
    const resCount5 = parsePastedBillText('AB.79.89.73.37.5');
    assert(resCount5.success === true && resCount5.items.length === 4, 'Test 29 count 5: 4 items');
    assert(resCount5.items.every((it) => it.count === 5 && it.totalAmount === 50), 'Test 29: all count 5, amount 50');

    const resCount10 = parsePastedBillText('AC.79.89.73.37.10');
    assert(resCount10.success === true && resCount10.items.length === 4, 'Test 29 count 10: 4 items');
    assert(resCount10.items.every((it) => it.count === 10 && it.totalAmount === 100), 'Test 29: all count 10, amount 100');
  }

  // 6. Existing pair formats preserved
  {
    const resOld1 = parsePastedBillText('AB*45*10');
    assert(resOld1.success === true && resOld1.items.length === 1, 'AB*45*10 preserved');
    assert(resOld1.items[0].number === 'AB:45' && resOld1.items[0].count === 10, 'AB:45 count 10');

    const resOld2 = parsePastedBillText('BC-23-10');
    assert(resOld2.success === true && resOld2.items.length === 1, 'BC-23-10 preserved');
    assert(resOld2.items[0].number === 'BC:23' && resOld2.items[0].count === 10, 'BC:23 count 10');

    const resOld3 = parsePastedBillText('Ab. Ac. Bc.. 79..2');
    assert(resOld3.success === true && resOld3.items.length === 3, 'Ab. Ac. Bc.. 79..2 preserved');
  }

  console.log('✓ Test 29 Passed: AB/AC/BC + multiple numbers + count parsed across case variations, flexible/trailing dots, variable numbers and counts');
}

console.log('\n========================================');
console.log('ALL 29 PASTE BILL PARSER TESTS PASSED!  ');
console.log('========================================\n');




