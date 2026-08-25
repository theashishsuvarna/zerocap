import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VerifyRequest {
  paymentId: string;
  orderId: string;
  utrNumber: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const anonKey = Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '';

    // Get the user's JWT from the request
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's token to verify identity
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Create admin client with service role for privileged operations
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { paymentId, orderId, utrNumber } = await req.json() as VerifyRequest;

    if (!paymentId || !orderId || !utrNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the payment record
    const { data: payment, error: payError } = await adminClient
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .maybeSingle();

    if (payError || !payment) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is the hirer on this order
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.hirer_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Only the hirer can submit payment verification' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payment.order_id !== orderId) {
      return new Response(
        JSON.stringify({ error: 'Payment does not match order' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment with UTR and set status to verified
    // In production, this is where you would call the actual payment gateway API
    // to verify the UTR. For now, we accept the UTR and mark as verified.
    const { error: updatePayError } = await adminClient
      .from('payments')
      .update({
        utr_number: utrNumber,
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: 'edge-function',
      })
      .eq('id', paymentId);

    if (updatePayError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status to payment_verified
    const { error: updateOrderError } = await adminClient
      .from('orders')
      .update({ status: 'payment_verified' })
      .eq('id', orderId);

    if (updateOrderError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update order status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark deliverables as unlocked
    const { data: deliverables } = await adminClient
      .from('deliverables')
      .select('*')
      .eq('order_id', orderId);

    if (deliverables && deliverables.length > 0) {
      for (const del of deliverables) {
        await adminClient
          .from('deliverables')
          .update({
            is_unlocked: true,
            unlocked_at: new Date().toISOString(),
          })
          .eq('id', del.id);
      }

      // Update order to paid + delivered
      await adminClient
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);
    }

    // Create transactions for both parties
    await adminClient.from('transactions').insert({
      user_id: order.creator_id,
      order_id: orderId,
      amount: Number(order.amount),
      type: 'credit',
      status: 'completed',
      description: `Payment received for order ${order.order_ref}`,
    });

    await adminClient.from('transactions').insert({
      user_id: order.hirer_id,
      order_id: orderId,
      amount: Number(order.amount),
      type: 'debit',
      status: 'completed',
      description: `Payment sent for order ${order.order_ref}`,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Payment verified successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
