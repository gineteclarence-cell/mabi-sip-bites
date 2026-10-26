    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <title>
        Receipt {{ $sale->transaction_number }}
    </title>

    <style>
        @page {
            margin: 32px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111827;
            background: #ffffff;
        }

        .receipt {
            max-width: 650px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
        }

        .header {
            padding: 28px 30px 24px;
            text-align: center;
            border-bottom: 1px dashed #d1d5db;
        }

        .logo {
            display: inline-block;
            margin-bottom: 12px;
            padding: 9px 13px;
            border-radius: 7px;
            background: #ffde59;
            font-weight: bold;
            font-size: 16px;
            color: #111111;
        }

        .business-name {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
        }

        .branch {
            margin-top: 6px;
            color: #64748b;
        }

        .receipt-label {
            margin-top: 5px;
            font-size: 11px;
            color: #64748b;
        }

        .info {
            padding: 22px 30px;
            border-bottom: 1px dashed #d1d5db;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 6px 0;
        }

        .label {
            width: 35%;
            color: #64748b;
        }

        .value {
            text-align: right;
            font-weight: bold;
        }

        .items {
            padding: 22px 30px;
        }

        .items-title {
            margin-bottom: 14px;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #64748b;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
        }

        .items-table th {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10px;
            text-align: left;
            color: #64748b;
        }

        .items-table td {
            padding: 11px 0;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }

        .text-right {
            text-align: right !important;
        }

        .product-name {
            font-weight: bold;
        }

        .product-meta {
            margin-top: 3px;
            font-size: 10px;
            color: #64748b;
        }

        .total {
            padding: 20px 30px;
            background: #f8fafc;
        }

        .total-table {
            width: 100%;
            border-collapse: collapse;
        }

        .total-label {
            font-size: 15px;
            font-weight: bold;
        }

        .total-amount {
            text-align: right;
            font-size: 20px;
            font-weight: bold;
        }

        .footer {
            padding: 20px 30px;
            text-align: center;
            border-top: 1px dashed #d1d5db;
            font-size: 10px;
            color: #64748b;
        }
    </style>
</head>

<body>

<div class="receipt">

    <div class="header">

        <div class="logo">
            MB
        </div>

        <h1 class="business-name">
            Mabi Sip &amp; Bites
        </h1>

        <div class="branch">
            {{ $sale->branch?->name ?? 'Branch' }}
        </div>

        <div class="receipt-label">
            SALES RECEIPT
        </div>

    </div>

    <div class="info">

        <table class="info-table">

            <tr>
                <td class="label">
                    Transaction
                </td>

                <td class="value">
                    {{ $sale->transaction_number }}
                </td>
            </tr>

            <tr>
                <td class="label">
                    Date
                </td>

                <td class="value">
                    {{
                        optional(
                            $sale->sale_date
                        )->format(
                            'M d, Y h:i A'
                        )
                    }}
                </td>
            </tr>

            <tr>
                <td class="label">
                    Staff
                </td>

                <td class="value">
                    {{ $sale->staff?->name ?? '—' }}
                </td>
            </tr>

            <tr>
                <td class="label">
                    Customer
                </td>

                <td class="value">
                    {{ $sale->customer?->name ?? 'Walk-in' }}
                </td>
            </tr>

            <tr>
                <td class="label">
                    Payment
                </td>

                <td class="value">
                    {{
                        strtoupper(
                            $sale->payment_method
                        )
                    }}
                </td>
            </tr>

        </table>

    </div>

    <div class="items">

        <div class="items-title">
            Items
        </div>

        <table class="items-table">

            <thead>

            <tr>

                <th>
                    Item
                </th>

                <th class="text-right">
                    Qty
                </th>

                <th class="text-right">
                    Price
                </th>

                <th class="text-right">
                    Subtotal
                </th>

            </tr>

            </thead>

            <tbody>

            @foreach($sale->saleItems as $item)

                <tr>

                    <td>

                        <div class="product-name">
                            {{
                                $item->product?->name
                                ?? 'Deleted product'
                            }}
                        </div>

                        @if($item->size_oz)

                            <div class="product-meta">
                                {{ $item->size_oz }} oz
                            </div>

                        @endif

                    </td>

                    <td class="text-right">
                        {{ $item->quantity }}
                    </td>

                    <td class="text-right">
                        ₱{{ number_format(
                            (float) $item->unit_price,
                            2
                        ) }}
                    </td>

                    <td class="text-right">
                        ₱{{ number_format(
                            (float) $item->subtotal,
                            2
                        ) }}
                    </td>

                </tr>

            @endforeach

            </tbody>

        </table>

    </div>

    <div class="total">

        <table class="total-table">

            <tr>

                <td class="total-label">
                    TOTAL
                </td>

                <td class="total-amount">
                    ₱{{ number_format(
                        (float) $sale->total_amount,
                        2
                    ) }}
                </td>

            </tr>

        </table>

    </div>

    <div class="footer">

        Thank you for your purchase!
        <br><br>

        Mabi Sip &amp; Bites
        &nbsp;•&nbsp;
        {{ $sale->transaction_number }}

    </div>

</div>

</body>
</html>