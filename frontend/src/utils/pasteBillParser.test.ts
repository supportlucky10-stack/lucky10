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

// TEST 27: The 5 New Clipboard Formats
{
  // --- FORMAT 1: AB MULTIPLE NUMBERS ---
  {
    const res = parsePastedBillText('AB.79..89.73.37.1');
    assert(res.success === true, 'Format 1: AB.79..89.73.37.1 should succeed');
    assert(res.items.length === 4, `Format 1: expected 4 items, got ${res.items.length}`);
    const expected = ['AB:79', 'AB:89', 'AB:73', 'AB:37'];
    for (let i = 0; i < 4; i++) {
      assert(res.items[i].number === expected[i], `Format 1 item ${i} number ${expected[i]}`);
      assert(res.items[i].count === 1, `Format 1 item ${i} count 1`);
      assert(res.items[i].type === 'Pair', `Format 1 item ${i} type Pair`);
    }

    // Repeated and flexible separators
    const abSeparators = [
      'AB.79.89.1',
      'AB.79..89.1',
      'AB..79..89..73..37..1',
      'AB-79-89-73-37-1',
      'AB=79=89=73=37=1',
      'AB+79+89+73+37+1',
    ];
    for (const inp of abSeparators) {
      const r = parsePastedBillText(inp);
      assert(r.success === true, `Format 1 separator: "${inp}" should succeed`);
    }

    // Case-insensitivity: AB, Ab, aB, ab
    for (const inp of ['AB.79..89.73.37.1', 'Ab.79..89.73.37.1', 'aB.79..89.73.37.1', 'ab.79..89.73.37.1']) {
      const r = parsePastedBillText(inp);
      assert(r.success === true && r.items.every((it) => it.number.startsWith('AB:')), `Format 1 case: "${inp}"`);
    }
  }

  // --- FORMAT 2: AC MULTIPLE NUMBERS ---
  {
    // Trailing separator allowed: AC.79.89.73.37.1.
    const res = parsePastedBillText('AC.79.89.73.37.1.');
    assert(res.success === true, 'Format 2: AC.79.89.73.37.1. should succeed');
    assert(res.items.length === 4, `Format 2: expected 4 items, got ${res.items.length}`);
    const expected = ['AC:79', 'AC:89', 'AC:73', 'AC:37'];
    for (let i = 0; i < 4; i++) {
      assert(res.items[i].number === expected[i], `Format 2 item ${i} number ${expected[i]}`);
      assert(res.items[i].count === 1, `Format 2 item ${i} count 1`);
      assert(res.items[i].type === 'Pair', `Format 2 item ${i} type Pair`);
    }

    // Case-insensitivity: AC, Ac, aC, ac
    for (const inp of ['AC.79.89.73.37.1', 'Ac.79.89.73.37.1', 'aC.79.89.73.37.1', 'ac.79.89.73.37.1']) {
      const r = parsePastedBillText(inp);
      assert(r.success === true && r.items.every((it) => it.number.startsWith('AC:')), `Format 2 case: "${inp}"`);
    }

    // Flexible separators
    for (const inp of ['AC.79.89.73.37.1', 'AC.79..89..73..37..1.', 'AC-79-89-73-37-1', 'AC=79=89=73=37=1']) {
      const r = parsePastedBillText(inp);
      assert(r.success === true, `Format 2 separator: "${inp}" should succeed`);
    }
  }

  // --- FORMAT 3: BC MULTIPLE NUMBERS ---
  {
    const res = parsePastedBillText('BC..79..89.73.37.1');
    assert(res.success === true, 'Format 3: BC..79..89.73.37.1 should succeed');
    assert(res.items.length === 4, `Format 3: expected 4 items, got ${res.items.length}`);
    const expected = ['BC:79', 'BC:89', 'BC:73', 'BC:37'];
    for (let i = 0; i < 4; i++) {
      assert(res.items[i].number === expected[i], `Format 3 item ${i} number ${expected[i]}`);
      assert(res.items[i].count === 1, `Format 3 item ${i} count 1`);
      assert(res.items[i].type === 'Pair', `Format 3 item ${i} type Pair`);
    }

    // Case-insensitivity: BC, Bc, bC, bc
    for (const inp of ['BC..79..89.73.37.1', 'Bc..79..89.73.37.1', 'bC..79..89.73.37.1', 'bc..79..89.73.37.1']) {
      const r = parsePastedBillText(inp);
      assert(r.success === true && r.items.every((it) => it.number.startsWith('BC:')), `Format 3 case: "${inp}"`);
    }

    // Flexible separators
    for (const inp of ['BC.79.89.1', 'BC..79..89..73..37..1', 'BC-79-89-73-37-1', 'BC=79=89=73=37=1']) {
      const r = parsePastedBillText(inp);
      assert(r.success === true, `Format 3 separator: "${inp}" should succeed`);
    }
  }

  // --- FORMAT 4: SUPER + BOX USING x/X ---
  {
    const xInputs = [
      '513*10*2',
      '513x10x2',
      '513X10X2',
      '513x10X2',
      '513X10x2',
      '513=10x2',
    ];
    for (const inp of xInputs) {
      const res = parsePastedBillText(inp);
      assert(res.success === true, `Format 4: "${inp}" should succeed`);
      assert(res.items.length === 2, `Format 4: "${inp}" expected 2 items, got ${res.items.length}`);
      assert(res.items[0].number === '513' && res.items[0].type === 'Direct' && res.items[0].count === 10, `Format 4: "${inp}" Direct 10`);
      assert(res.items[1].number === '513' && res.items[1].type === 'Shuffle' && res.items[1].count === 2, `Format 4: "${inp}" Shuffle 2`);
    }

    // Normal text containing x/X must NOT become bill entries
    for (const inv of ['Hello x', 'example', 'text x 10']) {
      const res = parsePastedBillText(inv);
      assert(res.success === false && res.items.length === 0, `Format 4: "${inv}" must NOT become a bill`);
    }
  }

  // --- FORMAT 5: MULTIPLE NUMBERS + SUPER ---
  {
    const res = parsePastedBillText('088.789.432.687.819-1');
    assert(res.success === true, 'Format 5: 088.789.432.687.819-1 should succeed');
    assert(res.items.length === 5, `Format 5: expected 5 items, got ${res.items.length}`);
    const expected = ['088', '789', '432', '687', '819'];
    for (let i = 0; i < 5; i++) {
      assert(res.items[i].number === expected[i], `Format 5 item ${i} number ${expected[i]}`);
      assert(res.items[i].type === 'Direct', `Format 5 item ${i} type Direct`);
      assert(res.items[i].count === 1, `Format 5 item ${i} count 1`);
    }
    // Verify leading zero preserved: "088"
    assert(res.items[0].number === '088', 'Format 5: leading zero must be preserved as "088"');

    // Variable number of numbers
    const varInputs = [
      { text: '088-1', count: 1 },
      { text: '088.789-1', count: 2 },
      { text: '088.789.432-1', count: 3 },
      { text: '088.789.432.687.819-1', count: 5 },
    ];
    for (const v of varInputs) {
      const r = parsePastedBillText(v.text);
      assert(r.success === true && r.items.length === v.count, `Format 5 variable: "${v.text}"`);
    }

    // Separator variations
    const sepInputs = [
      '088=789=432=687=819=1',
      '088+789+432+687+819+1',
      '088/789/432/687/819/1',
      '088:789:432:687:819:1',
      '088_789_432_687_819_1',
    ];
    for (const inp of sepInputs) {
      const r = parsePastedBillText(inp);
      assert(r.success === true && r.items.length === 5, `Format 5 separator: "${inp}"`);
    }
  }

  // --- MIXED CLIPBOARD TEST WITH UNRELATED TEXT ---
  {
    const mixedInput = `Hello
AB.79..89.73.37.1
Random text
513=10x2
Dear
088.789.432.687.819-1`;

    const res = parsePastedBillText(mixedInput);
    assert(res.success === true, 'Mixed clipboard parsing should succeed');
    // 4 items (AB) + 2 items (513) + 5 items (088...819) = 11 items
    assert(res.items.length === 11, `Expected 11 items, got ${res.items.length}`);
    assert(res.items[0].number === 'AB:79', 'Item 0: AB:79');
    assert(res.items[1].number === 'AB:89', 'Item 1: AB:89');
    assert(res.items[2].number === 'AB:73', 'Item 2: AB:73');
    assert(res.items[3].number === 'AB:37', 'Item 3: AB:37');
    assert(res.items[4].number === '513' && res.items[4].count === 10 && res.items[4].type === 'Direct', 'Item 4: 513 Direct 10');
    assert(res.items[5].number === '513' && res.items[5].count === 2 && res.items[5].type === 'Shuffle', 'Item 5: 513 Shuffle 2');
    assert(res.items[6].number === '088', 'Item 6: 088 Direct 1');
    assert(res.items[7].number === '789', 'Item 7: 789 Direct 1');
    assert(res.items[8].number === '432', 'Item 8: 432 Direct 1');
    assert(res.items[9].number === '687', 'Item 9: 687 Direct 1');
    assert(res.items[10].number === '819', 'Item 10: 819 Direct 1');
  }

  // --- PRESERVATION OF EXISTING FORMATS ---
  {
    assert(parsePastedBillText('638*3+2').items.length === 2, '638*3+2 preserved');
    assert(parsePastedBillText('638*3').items.length === 1, '638*3 preserved');
    assert(parsePastedBillText('ABC*8*15').items.length === 3, 'ABC*8*15 preserved');
    assert(parsePastedBillText('ALL*8*15').items.length === 3, 'ALL*8*15 preserved');
    assert(parsePastedBillText('A*6*50').items.length === 1, 'A*6*50 preserved');
    assert(parsePastedBillText('B*3*30').items.length === 1, 'B*3*30 preserved');
    assert(parsePastedBillText('C*7*30').items.length === 1, 'C*7*30 preserved');
    assert(parsePastedBillText('AB*45*10').items.length === 1, 'AB*45*10 preserved');
    assert(parsePastedBillText('BC*23*10').items.length === 1, 'BC*23*10 preserved');
    assert(parsePastedBillText('AC*89*10').items.length === 1, 'AC*89*10 preserved');
    assert(parsePastedBillText('928=2').items.length === 1, '928=2 preserved');
  }

  console.log('✓ Test 27 Passed: All 5 new formats, case-insensitivity, trailing dots, flexible separators, and existing formats verified');
}

console.log('\n========================================');
console.log('ALL 27 PASTE BILL PARSER TESTS PASSED!  ');
console.log('========================================\n');


