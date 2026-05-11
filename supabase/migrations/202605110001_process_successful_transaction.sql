create or replace function public.process_successful_transaction(
    p_reference text,
    p_amount_in_naira numeric,
    p_provider text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_transaction transactions%rowtype;
    v_wallet wallets%rowtype;
    v_new_balance numeric;
begin
    select *
    into v_transaction
    from public.transactions
    where reference = p_reference
      and status = 'pending'
    for update;

    if not found then
        select *
        into v_transaction
        from public.transactions
        where reference = p_reference
        limit 1;

        if found and v_transaction.status = 'completed' then
            select *
            into v_wallet
            from public.wallets
            where user_id = v_transaction.user_id;

            return jsonb_build_object(
                'status', 'success',
                'message', 'Transaction already processed',
                'new_balance', coalesce(v_wallet.balance, 0)
            );
        end if;

        return jsonb_build_object(
            'status', 'failed',
            'error', 'Transaction not found or already processed'
        );
    end if;

    if abs(p_amount_in_naira - v_transaction.amount) > 1.0 then
        return jsonb_build_object(
            'status', 'failed',
            'error', 'Amount mismatch'
        );
    end if;

    update public.wallets
    set balance = coalesce(balance, 0) + coalesce(v_transaction.coins, 0),
        updated_at = now()
    where user_id = v_transaction.user_id
    returning *
    into v_wallet;

    if not found then
        return jsonb_build_object(
            'status', 'failed',
            'error', 'Wallet not found'
        );
    end if;

    v_new_balance := coalesce(v_wallet.balance, 0);

    update public.transactions
    set status = 'completed',
        updated_at = now()
    where id = v_transaction.id;

    return jsonb_build_object(
        'status', 'success',
        'message', 'Transaction processed',
        'new_balance', v_new_balance,
        'provider', p_provider
    );
exception
    when others then
        return jsonb_build_object(
            'status', 'failed',
            'error', SQLERRM
        );
end;
$$;
