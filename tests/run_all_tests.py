"""
Master Test Runner for Catch the Phish Platform
Executes all unit, integration, and security test suites.
"""

import os
import sys
import unittest

# Ensure workspace root is in python path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

if __name__ == "__main__":
    print("=" * 65)
    print("  CATCH THE PHISH: FULL PLATFORM TEST SUITE EXECUTION")
    print("=" * 65)
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=os.path.join(ROOT_DIR, "tests"), pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("=" * 65)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("=" * 65)

    if result.wasSuccessful():
        print("[SUCCESS] All test suites passed with zero errors!")
        sys.exit(0)
    else:
        print("[FAILURE] Some test suites failed.")
        sys.exit(1)
