<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">

    <title>Inventory Report</title>

    <style>
    @page { margin: 30mm 12mm 18mm 12mm; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color:#171717; margin: 0; }
    .report-header { position: fixed; top: -30mm; left: -12mm; right: -12mm; height: 28mm;
        background:#ffe05d; padding: 6mm 14mm 0mm; color:#161616; }
    .brand { display:inline-block; vertical-align:middle; margin-right:12px; padding:8px 10px;
        border: 2px solid #111; border-radius:4px; font-size:21px; font-weight:bold; line-height:1; }
    .titleblock { display:inline-block; vertical-align:middle; line-height:1.45; }
    .titleblock h1 { font-size:18px; margin:0 0 2px; }
    .report-footer { position:fixed; bottom:-12mm; left:0; right:0; color:#888; border-top:1px solid #ececec; padding-top:5px; font-size:8px; }
    .meta { font-size:9px; color:#555; margin: 5px 0 13px; }
    .summary { width:100%; margin: 5px 0 15px; border-spacing: 0; }
    .summary td { width:auto; border:1px solid #f4de84; padding:10px; background:#fff5c7; vertical-align:top; }
    .summary strong { text-transform:uppercase; font-size:8px; letter-spacing:.3px; }
    table.data { width:100%; border-collapse:collapse; margin-top:8px; page-break-inside:auto; }
    table.data th { background:#ffdf5d; text-align:left; padding:6px; border:0; font-size:8px; }
    table.data td { padding:5px 6px; border-bottom:1px solid #f1efdf; vertical-align:top; }
    table.data tbody tr:nth-child(even) { background:#fff7d4; }
    table.data tr { page-break-inside:avoid; }
    table.data thead { display:table-header-group; }
    h2 { font-size:12px; margin:15px 0 6px; page-break-after:avoid; }
    .right { text-align:right!important; }
    .money { font-weight:bold; }
    .badge-low { color:#aa6d00; font-weight:bold; }
    .badge-out { color:#c52a28; font-weight:bold; }
    </style>
</head>

<body>

<div class="report-header"><div class="brand">MB</div><div class="titleblock"><h1>INVENTORY REPORT</h1><strong>Mabi Sip &amp; Bites — {{ $branchLabel }}</strong><br>Location: {{ $branchLocation }}</div></div>

<div class="meta">
    Generated: {{ $generatedAt }}
</div>

<table class="summary">
    <tr>
        <td>
            <strong>Ingredients</strong><br>
            {{ $report['totalIngredients'] }}
        </td>

        <td>
            <strong>Stock Value</strong><br>
            ₱{{ number_format($report['totalStockValue'], 2) }}
        </td>

        <td>
            <strong>Low Stock</strong><br>
            {{ $report['lowStockCount'] }}
        </td>

        <td>
            <strong>Out of Stock</strong><br>
            {{ $report['outOfStockCount'] }}
        </td>
    </tr>
</table>


<h2>By Category</h2>
<table class="data"><thead><tr><th>Category</th><th class="right">Ingredients</th></tr></thead><tbody>
@foreach(collect($report['ingredients'])->groupBy('category') as $category => $items)
<tr><td>{{ $category }}</td><td class="right">{{ $items->count() }}</td></tr>
@endforeach
</tbody></table>
<h2>Ingredient Details</h2>
<table class="data">
    <thead>
    <tr>
        <th>Ingredient</th>
        <th>Category</th>
        <th>Branch</th>
        <th>Stock</th>
        <th>Status</th>
        <th>Used By</th>
    </tr>
    </thead>

    <tbody>

    @foreach($report['ingredients'] as $row)

        <tr>
            <td>{{ $row['name'] }}</td>
            <td>{{ $row['category'] }}</td>
            <td>{{ $row['branch_name'] }}</td>

            <td>
                {{ $row['stock'] }} {{ $row['unit'] }}
            </td>

            <td>
                <span class="{{ $row['stock_status'] === 'Out of stock' ? 'badge-out' : ($row['stock_status'] === 'Low stock' ? 'badge-low' : '') }}">{{ $row['stock_status'] }}</span>
            </td>

            <td>
                {{
                    count($row['used_by'])
                        ? implode(', ', $row['used_by'])
                        : '—'
                }}
            </td>
        </tr>

    @endforeach

    </tbody>
</table>

<div class="report-footer">Mabi Sip &amp; Bites — Inventory Report &nbsp; | &nbsp; {{ $branchLabel }}</div>
</body>
</html>