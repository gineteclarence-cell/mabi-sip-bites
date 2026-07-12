<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mabi Sip & Bites — Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #0F172A;
            line-height: 1.5;
            background: #ffffff;
        }

        /* Header */
        .header {
            background: #0A0A0A;
            color: #ffffff;
            padding: 20px 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 28px;
        }

        .header-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .brand-mark {
            width: 36px;
            height: 36px;
            background: #FFDE59;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 800;
            color: #0A0A0A;
            text-align: center;
            line-height: 36px;
        }

        .brand-name {
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
        }

        .brand-sub {
            font-size: 10px;
            color: rgba(255,255,255,0.55);
            margin-top: 1px;
        }

        .header-meta {
            text-align: right;
        }

        .header-meta .report-title {
            font-size: 14px;
            font-weight: 700;
            color: #FFDE59;
        }

        .header-meta .meta-line {
            font-size: 9px;
            color: rgba(255,255,255,0.55);
            margin-top: 2px;
        }

        /* Page body */
        .body {
            padding: 0 28px 28px;
        }

        /* Section */
        .section {
            margin-bottom: 24px;
        }

        .section-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748B;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #E5E1D8;
        }

        /* KPI grid */
        .kpi-grid {
            display: table;
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .kpi-row {
            display: table-row;
        }

        .kpi-cell {
            display: table-cell;
            width: 33.33%;
            padding: 12px 14px;
            background: #F4F2EC;
            border-radius: 8px;
        }

        /* dompdf doesn't support display:table-cell gap, so use borders trick */
        .kpi-cell + .kpi-cell {
            padding-left: 20px;
        }

        .kpi-label {
            font-size: 9px;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }

        .kpi-value {
            font-size: 18px;
            font-weight: 700;
            color: #0F172A;
        }

        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        thead th {
            background: #F4F2EC;
            text-align: left;
            padding: 8px 12px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #64748B;
        }

        tbody td {
            padding: 8px 12px;
            border-bottom: 1px solid #E5E1D8;
            font-size: 10px;
            color: #0F172A;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .text-right { text-align: right; }
        .font-medium { font-weight: 600; }

        /* Badge */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 600;
        }

        .badge-present { background: #F0FDF4; color: #16A34A; }
        .badge-late { background: #FFFBEB; color: #D97706; }
        .badge-absent { background: #FEF2F2; color: #DC2626; }

        /* Highlight row */
        .highlight {
            background: #FFFBEB;
        }

        /* Two-column layout for smaller sections */
        .two-col {
            display: table;
            width: 100%;
        }
        .col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 12px;
        }
        .col:last-child {
            padding-right: 0;
            padding-left: 12px;
        }

        /* Footer */
        .footer {
            margin-top: 28px;
            padding-top: 12px;
            border-top: 1px solid #E5E1D8;
            display: flex;
            justify-content: space-between;
        }

        .footer-text {
            font-size: 8px;
            color: #94A3B8;
        }

        /* dompdf page number */
        .page-number:after {
            content: counter(page);
        }
    </style>
</head>
<body>

<div class="header">
    <div class="header-brand">
        <div class="brand-mark">MB</div>
        <div>
            <div class="brand-name">Mabi Sip &amp; Bites</div>
            <div class="brand-sub">Store Management System</div>
        </div>
    </div>
    <div class="header-meta">
        <div class="report-title">Business Report</div>
        <div class="meta-line">{{ $branchLabel }}</div>
        <div class="meta-line">{{ $startDate }} &mdash; {{ $endDate }}</div>
        <div class="meta-line">Generated {{ $generatedAt }}</div>
    </div>
</div>

<div class="body">

    {{-- ── Sales Summary ──────────────────────────────────────────────────── --}}
    <div class="section">
        <div class="section-title">Sales Summary</div>

        <table>
            <tbody>
                <tr>
                    <td>
                        <span class="kpi-label">Total revenue</span><br>
                        <strong class="kpi-value" style="font-size:16px;">
                            &#8369;{{ number_format($salesSummary['totalRevenue'], 2) }}
                        </strong>
                    </td>
                    <td>
                        <span class="kpi-label">Total transactions</span><br>
                        <strong class="kpi-value" style="font-size:16px;">
                            {{ number_format($salesSummary['totalTransactions']) }}
                        </strong>
                    </td>
                    <td>
                        <span class="kpi-label">Average sale value</span><br>
                        <strong class="kpi-value" style="font-size:16px;">
                            &#8369;{{ number_format($salesSummary['averageSale'], 2) }}
                        </strong>
                    </td>
                </tr>
            </tbody>
        </table>

        @if(count($salesSummary['byPaymentMethod']) > 0)
        <table style="margin-top:12px;">
            <thead>
                <tr>
                    <th>Payment method</th>
                    <th class="text-right">Transactions</th>
                    <th class="text-right">Revenue</th>
                </tr>
            </thead>
            <tbody>
                @foreach($salesSummary['byPaymentMethod'] as $row)
                <tr>
                    <td class="font-medium">{{ ucfirst($row['method']) }}</td>
                    <td class="text-right">{{ $row['count'] }}</td>
                    <td class="text-right">&#8369;{{ number_format($row['total'], 2) }}</td>
                </tr>
                @endforeach
                <tr class="highlight">
                    <td class="font-medium">Total</td>
                    <td class="text-right font-medium">{{ $salesSummary['totalTransactions'] }}</td>
                    <td class="text-right font-medium">&#8369;{{ number_format($salesSummary['totalRevenue'], 2) }}</td>
                </tr>
            </tbody>
        </table>
        @else
        <p style="margin-top:8px; font-size:10px; color:#64748B;">No sales recorded in this period.</p>
        @endif
    </div>

    {{-- ── Inventory Snapshot ──────────────────────────────────────────────── --}}
    <div class="section">
        <div class="section-title">Inventory Snapshot</div>

        <table>
            <tbody>
                <tr>
                    <td>
                        <span class="kpi-label">Active products</span><br>
                        <strong class="kpi-value" style="font-size:16px;">
                            {{ $inventorySnapshot['totalProducts'] }}
                        </strong>
                    </td>
                    <td>
                        <span class="kpi-label">Total stock value</span><br>
                        <strong class="kpi-value" style="font-size:16px;">
                            &#8369;{{ number_format($inventorySnapshot['totalStockValue'], 2) }}
                        </strong>
                    </td>
                    <td>
                        <span class="kpi-label">Low stock items</span><br>
                        <strong class="kpi-value" style="font-size:16px; color:{{ $inventorySnapshot['lowStockCount'] > 0 ? '#D97706' : '#0F172A' }};">
                            {{ $inventorySnapshot['lowStockCount'] }}
                        </strong>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    {{-- ── Attendance Summary ───────────────────────────────────────────────── --}}
    <div class="section">
        <div class="section-title">Attendance Summary</div>

        @if($attendanceSummary['totalLogs'] > 0)
        <table>
            <thead>
                <tr>
                    <th>Status</th>
                    <th class="text-right">Count</th>
                    <th class="text-right">% of logs</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $total = $attendanceSummary['totalLogs'];
                    $statuses = [
                        'present' => ['label' => 'Present', 'badge' => 'present'],
                        'late'    => ['label' => 'Late', 'badge' => 'late'],
                        'absent'  => ['label' => 'Absent', 'badge' => 'absent'],
                    ];
                @endphp
                @foreach($statuses as $key => $meta)
                <tr>
                    <td>
                        <span class="badge badge-{{ $meta['badge'] }}">{{ $meta['label'] }}</span>
                    </td>
                    <td class="text-right">{{ $attendanceSummary[$key] }}</td>
                    <td class="text-right">
                        {{ $total > 0 ? number_format(($attendanceSummary[$key] / $total) * 100, 1) : '0.0' }}%
                    </td>
                </tr>
                @endforeach
                <tr class="highlight">
                    <td class="font-medium">Total logs</td>
                    <td class="text-right font-medium">{{ $total }}</td>
                    <td class="text-right font-medium">100%</td>
                </tr>
            </tbody>
        </table>
        @else
        <p style="font-size:10px; color:#64748B;">No attendance logs recorded in this period.</p>
        @endif
    </div>

</div>

<div class="footer" style="padding: 0 28px 20px;">
    <span class="footer-text">Mabi Sip &amp; Bites Store Management System &mdash; Confidential</span>
    <span class="footer-text">Page <span class="page-number"></span></span>
</div>

</body>
</html>
