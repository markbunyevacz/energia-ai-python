#!/usr/bin/env python3
"""
Permanent Jaclang Compatibility Patch for Python 3.11
This script patches the jaclang installation to work with Python 3.11 by modifying 
the typing imports to use typing_extensions for the override decorator.
"""

import os
import sys
import typing
from pathlib import Path
from typing_extensions import override

def patch_jaclang_builtin():
    """Patch the jaclang builtin module to fix the import issue."""
    try:
        # First apply runtime patch
        if not hasattr(typing, 'override'):
            typing.override = override
            print("✓ Applied runtime patch for typing.override")
        
        # Find jaclang installation path
        import jaclang
        jaclang_path = Path(jaclang.__path__[0])
        builtin_file = jaclang_path / "runtimelib" / "builtin.py"
        
        if builtin_file.exists():
            print(f"Found builtin.py at: {builtin_file}")
            
            # Read the current content
            with open(builtin_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if it's already patched
            if 'typing_extensions import override' in content:
                print("✓ File is already patched")
                return True
            
            # Apply the patch
            if 'from typing import ClassVar, Optional, override' in content:
                print("Applying source code patch...")
                
                # Replace the problematic import
                patched_content = content.replace(
                    'from typing import ClassVar, Optional, override',
                    '''from typing import ClassVar, Optional
try:
    from typing import override
except ImportError:
    from typing_extensions import override'''
                )
                
                # Create backup
                backup_file = str(builtin_file) + '.backup'
                if not os.path.exists(backup_file):
                    with open(backup_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"✓ Created backup: {backup_file}")
                
                # Write patched content
                with open(builtin_file, 'w', encoding='utf-8') as f:
                    f.write(patched_content)
                print("✓ Applied source code patch to builtin.py")
                return True
            else:
                print("No problematic import found in builtin.py")
                return True
        else:
            print(f"✗ builtin.py not found at expected location: {builtin_file}")
            return False
    
    except Exception as e:
        print(f"✗ Error patching jaclang: {e}")
        return False

def test_jaclang():
    """Test if jaclang works after patching."""
    try:
        # Test import
        import jaclang.cli.cli
        print("✓ jaclang.cli.cli import successful")
        
        # Test CLI functionality
        from jaclang.cli.cli import start_cli
        print("✓ start_cli function accessible")
        
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

def main():
    print(f"Python version: {sys.version}")
    print("Jaclang Compatibility Patcher for Python 3.11")
    print("=" * 50)
    
    if patch_jaclang_builtin():
        print("\nTesting patched installation...")
        if test_jaclang():
            print("\n🎉 SUCCESS! Jaclang is now compatible with Python 3.11")
            print("\nYou can now use:")
            print("  python jac_wrapper.py --version")
            print("  python jac_wrapper.py [other commands]")
            print("\nOr directly use the original jac command:")
            print("  jac --version")
        else:
            print("\n❌ Patch applied but testing failed")
    else:
        print("\n❌ Failed to apply patch")

if __name__ == "__main__":
    main() 