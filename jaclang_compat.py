"""
Jaclang Compatibility Module for Python 3.11
This module must be imported BEFORE importing any jaclang modules.

Usage:
    import jaclang_compat  # Import this first
    import jaclang
    # Now jaclang should work
"""

import sys
import typing
from typing_extensions import override

# Monkey patch the override decorator into the typing module
if not hasattr(typing, 'override'):
    typing.override = override
    print(f"✓ Patched typing.override for Python {sys.version_info.major}.{sys.version_info.minor}")

# Also patch any modules that jaclang might import
def ensure_override_available():
    """Ensure override is available in typing module."""
    if not hasattr(typing, 'override'):
        typing.override = override

# Apply the patch immediately
ensure_override_available() 