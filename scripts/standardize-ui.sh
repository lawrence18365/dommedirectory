#!/bin/bash

# Standardize UI Colors Script
# Converts all "off-colors" (purple, inconsistent grays) to match homepage design

echo "🔧 Standardizing UI colors across the project..."

# Function to replace colors in a file
standardize_file() {
    local file="$1"
    
    # Skip if not a file
    [ -f "$file" ] || return
    
    # Skip node_modules and .next
    [[ "$file" == *"node_modules"* ]] && return
    [[ "$file" == *".next"* ]] && return
    
    echo "  Processing: $file"
    
    # Replace purple colors with red
    sed -i '' \
        -e 's/text-purple-400/text-red-600/g' \
        -e 's/text-purple-500/text-red-600/g' \
        -e 's/text-purple-600/text-red-600/g' \
        -e 's/bg-purple-400/bg-red-600/g' \
        -e 's/bg-purple-500/bg-red-600/g' \
        -e 's/bg-purple-600/bg-red-600/g' \
        -e 's/bg-purple-500\\/20/bg-red-600\\/20/g' \
        -e 's/bg-purple-600\\/20/bg-red-600\\/20/g' \
        -e 's/bg-purple-900\\/20/bg-red-600\\/20/g' \
        -e 's/bg-purple-900\\/30/bg-red-600\\/20/g' \
        -e 's/bg-purple-900\\/40/bg-red-600\\/20/g' \
        -e 's/border-purple-700\\/30/border-gray-700/g' \
        -e 's/border-purple-900\\/20/border-gray-800/g' \
        -e 's/border-purple-900\\/30/border-gray-800/g' \
        -e 's/border-purple-900\\/40/border-gray-800/g' \
        -e 's/hover:bg-purple-900\\/20/hover:bg-gray-800/g' \
        -e 's/hover:border-red-500\\/50/hover:border-red-600/g' \
        -e 's/focus:ring-purple-500/focus:ring-red-500/g' \
        -e 's/focus:border-purple-500/focus:border-red-500/g' \
        -e 's/from-purple-900\\/40/from-red-900\\/20/g' \
        -e 's/to-purple-800\\/20/to-red-900\\/10/g' \
        -e 's/gradient-to-br from-purple-600 to-purple-800/gradient-to-br from-red-600 to-red-800/g' \
        "$file" 2>/dev/null || true
}

# Find and process all JS/JSX files
find src -type f \( -name "*.js" -o -name "*.jsx" \) | while read file; do
    standardize_file "$file"
done

echo ""
echo "✅ Color standardization complete!"
echo ""
echo "📋 Summary of changes:"
echo "  • purple-* -> red-600 (accent color)"
echo "  • purple-900/* -> gray-800/* (borders)"
echo "  • purple backgrounds -> red-600/20 (subtle red)"
echo ""
echo "🎨 Standard color palette:"
echo "  • Background: #0a0a0a (main), #0d0d0d (header), #1a1a1a (cards)"
echo "  • Accent: red-600"
echo "  • Text: white (primary), gray-400 (secondary)"
echo "  • Borders: gray-800, gray-700"
