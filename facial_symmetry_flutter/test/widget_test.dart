import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:facial_symmetry_flutter/main.dart';

void main() {
  testWidgets('App initialization test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that our initial status text is present
    expect(find.text('Ready to initialize'), findsOneWidget);
    expect(find.text('Start Detection'), findsNothing);

    // Verify the initialize button exists
    expect(find.text('Initialize Detector'), findsOneWidget);
  });
}
