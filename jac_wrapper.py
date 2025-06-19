#!/usr/bin/env python3
"""
Jac Command Wrapper for Python 3.11
This script applies the typing.override compatibility patch and runs jac commands.

Usage:
    python jac_wrapper.py --version
    python jac_wrapper.py [other jac arguments]
"""

import sys
import typing
from typing_extensions import override

# Apply compatibility patch
if not hasattr(typing, 'override'):
    typing.override = override
    print(f"✓ Patched typing.override for Python {sys.version_info.major}.{sys.version_info.minor}")

try:
    # Import jaclang after patching
    from jaclang.cli.cli import start_cli
    
    # Run the jac CLI
    start_cli()
    
except Exception as e:
    print(f"Error running jac: {e}")
    print(f"Make sure jaclang is properly installed.")
    sys.exit(1) 