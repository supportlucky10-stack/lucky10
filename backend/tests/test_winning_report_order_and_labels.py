import unittest

WINNING_SECTION_ORDER = ['SUPER', 'BOX', 'AB', 'BC', 'AC', 'A', 'B', 'C']

def get_category_order_rank(category: str) -> int:
    cat_upper = (category or '').upper().strip()
    if cat_upper in WINNING_SECTION_ORDER:
        return WINNING_SECTION_ORDER.index(cat_upper)
    return 999

def get_prize_rank(prize_str: str) -> int:
    p = (prize_str or '').upper()
    if '1ST' in p or '1 DIGIT' in p or '2 DIGIT' in p or 'BOX' in p:
        return 1
    if '2ND' in p:
        return 2
    if '3RD' in p:
        return 3
    if '4TH' in p:
        return 4
    if '5TH' in p:
        return 5
    if 'COMPLIMENT' in p or '6TH' in p:
        return 6
    return 1

def get_prize_position_display(card: dict, category: str = None) -> str:
    cat_upper = (category or card.get('gameMode') or card.get('type') or '').upper().strip()
    if cat_upper and cat_upper != 'SUPER':
        return 'WINNER'
    
    p = (card.get('prize') or '').upper()
    if '1ST' in p:
        return '1ST PRIZE'
    if '2ND' in p:
        return '2ND PRIZE'
    if '3RD' in p:
        return '3RD PRIZE'
    if '4TH' in p:
        return '4TH PRIZE'
    if '5TH' in p:
        return '5TH PRIZE'
    if 'COMPLIMENT' in p:
        return 'COMPLIMENTS'
    return '1ST PRIZE'

class TestWinningReportOrderAndLabels(unittest.TestCase):
    def test_section_order(self):
        unsorted_sections = ['C', 'AB', 'SUPER', 'AC', 'BOX', 'B', 'BC', 'A']
        sorted_sections = sorted(unsorted_sections, key=get_category_order_rank)
        expected_order = ['SUPER', 'BOX', 'AB', 'BC', 'AC', 'A', 'B', 'C']
        self.assertEqual(sorted_sections, expected_order)

    def test_super_cards_order(self):
        unsorted_cards = [
            {'prize': 'COMPLIMENTS (450)'},
            {'prize': '3RD PRIZE (215)'},
            {'prize': '1ST PRIZE (742)'},
            {'prize': '5TH PRIZE (610)'},
            {'prize': '2ND PRIZE (819)'},
            {'prize': '4TH PRIZE (109)'},
        ]
        sorted_cards = sorted(unsorted_cards, key=lambda c: get_prize_rank(c['prize']))
        prizes_in_order = [c['prize'] for c in sorted_cards]
        self.assertEqual(prizes_in_order, [
            '1ST PRIZE (742)',
            '2ND PRIZE (819)',
            '3RD PRIZE (215)',
            '4TH PRIZE (109)',
            '5TH PRIZE (610)',
            'COMPLIMENTS (450)',
        ])

    def test_super_badge_labels(self):
        self.assertEqual(get_prize_position_display({'prize': '1st Prize'}, 'SUPER'), '1ST PRIZE')
        self.assertEqual(get_prize_position_display({'prize': '2nd Prize'}, 'SUPER'), '2ND PRIZE')
        self.assertEqual(get_prize_position_display({'prize': '3rd Prize'}, 'SUPER'), '3RD PRIZE')
        self.assertEqual(get_prize_position_display({'prize': '4th Prize'}, 'SUPER'), '4TH PRIZE')
        self.assertEqual(get_prize_position_display({'prize': '5th Prize'}, 'SUPER'), '5TH PRIZE')
        self.assertEqual(get_prize_position_display({'prize': 'Compliment Prize'}, 'SUPER'), 'COMPLIMENTS')

    def test_non_super_badge_labels_must_be_winner(self):
        non_super_sections = ['BOX', 'AB', 'BC', 'AC', 'A', 'B', 'C']
        sample_prizes = ['1st Prize', '2nd Prize', 'Box Winner', 'Compliment', 'Any']
        for section in non_super_sections:
            for prize in sample_prizes:
                label = get_prize_position_display({'prize': prize}, section)
                self.assertEqual(label, 'WINNER', f"Failed for section {section} with prize {prize}")

if __name__ == '__main__':
    unittest.main()
