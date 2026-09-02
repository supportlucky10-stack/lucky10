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

console.log('\n========================================');
console.log('ALL 14 PASTE BILL PARSER TESTS PASSED!  ');
console.log('========================================\n');
