import { NextRequest, NextResponse } from 'next/server';
import { depositVerification } from '@/lib/deposit-verification';
import { validateTransactionHash } from '@/lib/security-middleware';

// GET deposit transaction status
export async function GET(request: NextRequest) {
  try {
    const transactionHash = request.nextUrl.searchParams.get('tx');
    
    if (!transactionHash) {
      return NextResponse.json(
        { error: 'Transaction hash required' },
        { status: 400 }
      );
    }
    
    // Validate transaction hash format
    if (!validateTransactionHash(transactionHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }
    
    // Get transaction details without marking as processed
    const details = await depositVerification.getTransactionDetails(transactionHash);
    
    if (!details.found) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Transaction not found on blockchain yet'
      });
    }
    
    if (details.confirmations < 2) {
      return NextResponse.json({
        status: 'pending',
        confirmations: details.confirmations,
        requiredConfirmations: 2,
        message: `Waiting for confirmations (${details.confirmations}/2)`
      });
    }
    
    if (!details.status) {
      return NextResponse.json({
        status: 'failed',
        message: 'Transaction failed'
      });
    }
    
    if (!details.amount) {
      return NextResponse.json({
        status: 'invalid',
        message: 'No USDC transfer to treasury found in transaction'
      });
    }
    
    return NextResponse.json({
      status: 'ready',
      confirmations: details.confirmations,
      amount: details.amount,
      from: details.from,
      message: 'Transaction confirmed and ready for deposit'
    });
    
  } catch (error) {
    console.error('[Deposit Status API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check transaction status' },
      { status: 500 }
    );
  }
}
