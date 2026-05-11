import 'package:flutter_test/flutter_test.dart';

import 'package:facial_symmetry_flutter/main.dart';

void main() {
  testWidgets('App initialization test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const FacialSymmetryApp());

    // Verify that our initial status text is present
    expect(find.text('Facial Symmetry Analysis'), findsWidgets);
    
    // Verify the start button exists
    expect(find.text('Start Analysis'), findsOneWidget);
  });
}
