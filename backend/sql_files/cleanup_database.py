#!/usr/bin/env python3
"""
Database Cleanup Script for Geo Game SQL Practice Website
Removes irrelevant columns from countries.sql, states.sql, and cities.sql
while preserving all rows and data integrity.

Handles multiple INSERT INTO ... VALUES batches per file.
"""

import re
import os
import sys

# ============================================================
# Configuration: columns to KEEP for each table
# ============================================================

COUNTRIES_KEEP = [
    'id', 'name', 'iso2', 'iso3', 'capital', 'currency', 'currency_name',
    'gdp', 'latitude', 'longitude', 'nationality', 'phonecode',
    'population', 'region', 'subregion'
]

STATES_KEEP = [
    'id', 'name', 'country_id', 'country_code', 'country_name',
    'latitude', 'longitude', 'population', 'type'
]

CITIES_KEEP = [
    'id', 'name', 'country_id', 'country_code', 'country_name',
    'latitude', 'longitude', 'population', 'state_id', 'state_code',
    'state_name'
]


def parse_create_table(sql_text):
    """
    Parse a CREATE TABLE statement and return ordered list of column names.
    """
    match = re.search(r'CREATE TABLE[^(]*\((.*?)\)\s*ENGINE', sql_text, re.DOTALL)
    if not match:
        raise ValueError("Could not find CREATE TABLE statement")
    
    body = match.group(1)
    columns = []
    for line in body.split('\n'):
        line = line.strip()
        col_match = re.match(r'`(\w+)`', line)
        if col_match:
            columns.append(col_match.group(1))
    
    return columns


def rebuild_create_table(create_sql, all_columns, keep_columns):
    """
    Rebuild the CREATE TABLE statement keeping only specified columns.
    """
    match = re.search(r'(CREATE TABLE[^(]*\()(.*?)(\)\s*ENGINE.*?;)', create_sql, re.DOTALL)
    if not match:
        raise ValueError("Could not find CREATE TABLE statement")
    
    prefix = match.group(1)
    body = match.group(2)
    suffix = match.group(3)
    
    lines = body.split('\n')
    removed_columns = set(all_columns) - set(keep_columns)
    kept_lines = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Column definition
        col_match = re.match(r'`(\w+)`', stripped)
        if col_match:
            if col_match.group(1) in removed_columns:
                continue
            kept_lines.append(line)
            continue
        
        # KEY or CONSTRAINT referencing removed column
        skip = False
        for removed_col in removed_columns:
            if f'`{removed_col}`' in stripped:
                skip = True
                break
        if skip:
            continue
        
        kept_lines.append(line)
    
    # Fix trailing commas: the last definition before ) should not end with comma
    for i in range(len(kept_lines) - 1, -1, -1):
        stripped = kept_lines[i].strip()
        if stripped and not stripped.startswith('PRIMARY') and not stripped.startswith('KEY') and not stripped.startswith('CONSTRAINT'):
            # This is likely the last column or constraint line
            pass
        if stripped.endswith(','):
            # Check if next non-empty line is a closing paren or another definition
            has_next = False
            for j in range(i + 1, len(kept_lines)):
                next_s = kept_lines[j].strip()
                if next_s:
                    has_next = True
                    break
            if not has_next:
                kept_lines[i] = kept_lines[i].rstrip().rstrip(',')
            break
        elif stripped:
            break
    
    new_body = '\n'.join(kept_lines)
    return prefix + new_body + suffix


def parse_values_from_row(row_content):
    """
    Parse the content between ( and ) of a single INSERT row.
    Handles quoted strings with escaped quotes, NULL, numbers, nested JSON.
    Returns a list of value strings (including their quotes).
    """
    values = []
    i = 0
    n = len(row_content)
    
    while i < n:
        # Skip whitespace
        while i < n and row_content[i] in (' ', '\t', '\n', '\r'):
            i += 1
        if i >= n:
            break
        
        if row_content[i] == "'":
            # Quoted string
            j = i + 1
            while j < n:
                if row_content[j] == '\\':
                    j += 2
                    continue
                if row_content[j] == "'":
                    if j + 1 < n and row_content[j + 1] == "'":
                        j += 2
                        continue
                    else:
                        break
                j += 1
            values.append(row_content[i:j + 1])
            i = j + 1
        else:
            # Unquoted: number, NULL, etc.
            j = i
            while j < n and row_content[j] != ',':
                j += 1
            values.append(row_content[i:j].strip())
            i = j
        
        # Skip whitespace and comma
        while i < n and row_content[i] in (' ', '\t', '\n', '\r'):
            i += 1
        if i < n and row_content[i] == ',':
            i += 1
    
    return values


def find_matching_paren(text, start):
    """
    Starting from '(' at text[start], find the matching ')'.
    Handles nested parens and quoted strings.
    Returns index of ')' or -1.
    """
    depth = 0
    i = start
    n = len(text)
    
    while i < n:
        ch = text[i]
        if ch == "'":
            i += 1
            while i < n:
                if text[i] == '\\':
                    i += 2
                    continue
                if text[i] == "'":
                    if i + 1 < n and text[i + 1] == "'":
                        i += 2
                        continue
                    break
                i += 1
            i += 1
            continue
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def process_sql_file(filepath, table_name, keep_columns):
    """
    Process a single SQL file: rebuild CREATE TABLE and all INSERT batches.
    """
    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_size = len(content)
    
    # Parse original columns from CREATE TABLE
    all_columns = parse_create_table(content)
    print(f"  Original columns ({len(all_columns)}): {all_columns}")
    
    # Determine which indices to keep
    keep_indices = []
    for i, col in enumerate(all_columns):
        if col in keep_columns:
            keep_indices.append(i)
    
    kept_col_names = [all_columns[i] for i in keep_indices]
    removed_cols = [c for c in all_columns if c not in keep_columns]
    print(f"  Keeping ({len(keep_indices)}): {kept_col_names}")
    print(f"  Removing ({len(removed_cols)}): {removed_cols}")
    
    # Find end of CREATE TABLE statement
    engine_match = re.search(r'\)\s*ENGINE[^;]*;\n?', content)
    if not engine_match:
        raise ValueError(f"Could not find end of CREATE TABLE in {filepath}")
    
    create_end = engine_match.end()
    create_sql = content[:create_end]
    rest_content = content[create_end:]
    
    # Rebuild CREATE TABLE
    new_create = rebuild_create_table(create_sql, all_columns, keep_columns)
    
    # Build new INSERT header template
    new_insert_cols = ", ".join(f"`{all_columns[i]}`" for i in keep_indices)
    new_insert_header = f"INSERT INTO `{table_name}` ({new_insert_cols}) VALUES\n"
    
    # Find all INSERT INTO ... VALUES batches and process them
    # Pattern: INSERT INTO `table` (...) VALUES\n(row1),\n(row2),\n...(rowN);
    insert_pattern = re.compile(
        r"INSERT INTO `" + re.escape(table_name) + r"` \([^)]+\) VALUES\s*\n?"
    )
    
    total_rows = 0
    output_parts = [new_create, '\n']
    
    pos = 0
    batch_num = 0
    
    while True:
        match = insert_pattern.search(rest_content, pos)
        if not match:
            break
        
        batch_num += 1
        batch_rows = []
        
        # Start parsing rows after "VALUES\n"
        row_pos = match.end()
        
        while row_pos < len(rest_content):
            # Skip whitespace
            while row_pos < len(rest_content) and rest_content[row_pos] in (' ', '\t', '\n', '\r'):
                row_pos += 1
            
            if row_pos >= len(rest_content):
                break
            
            if rest_content[row_pos] == '(':
                # Found a row tuple
                end_paren = find_matching_paren(rest_content, row_pos)
                if end_paren == -1:
                    print(f"  WARNING: Could not find closing paren in batch {batch_num}")
                    break
                
                row_content = rest_content[row_pos + 1:end_paren]
                values = parse_values_from_row(row_content)
                
                if len(values) != len(all_columns):
                    print(f"  WARNING: Row has {len(values)} values, expected {len(all_columns)} in batch {batch_num}, row {total_rows + 1}")
                
                # Keep only desired columns
                kept_values = []
                for idx in keep_indices:
                    if idx < len(values):
                        kept_values.append(values[idx])
                    else:
                        kept_values.append('NULL')
                
                batch_rows.append(kept_values)
                total_rows += 1
                
                if total_rows % 25000 == 0:
                    print(f"  Processed {total_rows} rows...")
                
                row_pos = end_paren + 1
                
                # Skip whitespace
                while row_pos < len(rest_content) and rest_content[row_pos] in (' ', '\t', '\n', '\r'):
                    row_pos += 1
                
                if row_pos < len(rest_content):
                    if rest_content[row_pos] == ',':
                        row_pos += 1
                        continue
                    elif rest_content[row_pos] == ';':
                        row_pos += 1
                        break
                    else:
                        break
            else:
                break
        
        pos = row_pos
        
        # Write this batch
        if batch_rows:
            output_parts.append(new_insert_header)
            for i, row in enumerate(batch_rows):
                row_str = '(' + ', '.join(row) + ')'
                if i < len(batch_rows) - 1:
                    row_str += ',\n'
                else:
                    row_str += ';\n'
                output_parts.append(row_str)
            output_parts.append('\n')
    
    print(f"  Total batches processed: {batch_num}")
    print(f"  Total rows processed: {total_rows}")
    
    # Write output
    output = ''.join(output_parts)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(output)
    
    new_size = os.path.getsize(filepath)
    print(f"  Output written: {new_size / 1024 / 1024:.2f} MB")
    
    return total_rows


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    files_config = [
        ('countries.sql', 'countries', COUNTRIES_KEEP),
        ('states.sql', 'states', STATES_KEEP),
        ('cities.sql', 'cities', CITIES_KEEP),
    ]
    
    print("=" * 60)
    print("SQL Database Cleanup for Geo Game")
    print("=" * 60)
    
    original_sizes = {}
    for filename, _, _ in files_config:
        filepath = os.path.join(base_dir, filename)
        original_sizes[filename] = os.path.getsize(filepath)
        print(f"  {filename}: {original_sizes[filename] / 1024 / 1024:.2f} MB")
    
    results = {}
    for filename, table_name, keep_cols in files_config:
        filepath = os.path.join(base_dir, filename)
        row_count = process_sql_file(filepath, table_name, keep_cols)
        new_size = os.path.getsize(filepath)
        results[filename] = {
            'rows': row_count,
            'old_size': original_sizes[filename],
            'new_size': new_size,
        }
    
    # Summary
    print("\n" + "=" * 70)
    print("CLEANUP SUMMARY")
    print("=" * 70)
    print(f"{'File':<20} {'Rows':<10} {'Before (MB)':<14} {'After (MB)':<14} {'Saved (MB)':<14} {'%':<6}")
    print("-" * 70)
    
    total_old = 0
    total_new = 0
    for filename, info in results.items():
        old_mb = info['old_size'] / 1024 / 1024
        new_mb = info['new_size'] / 1024 / 1024
        saved_mb = old_mb - new_mb
        pct = (saved_mb / old_mb * 100) if old_mb > 0 else 0
        total_old += info['old_size']
        total_new += info['new_size']
        print(f"{filename:<20} {info['rows']:<10} {old_mb:<14.2f} {new_mb:<14.2f} {saved_mb:<14.2f} {pct:<6.1f}")
    
    total_old_mb = total_old / 1024 / 1024
    total_new_mb = total_new / 1024 / 1024
    total_saved = total_old_mb - total_new_mb
    total_pct = (total_saved / total_old_mb * 100) if total_old_mb > 0 else 0
    print("-" * 70)
    print(f"{'TOTAL':<20} {'':<10} {total_old_mb:<14.2f} {total_new_mb:<14.2f} {total_saved:<14.2f} {total_pct:<6.1f}")


if __name__ == '__main__':
    main()
