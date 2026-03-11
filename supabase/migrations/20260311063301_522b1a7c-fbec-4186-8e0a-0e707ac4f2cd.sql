-- Allow users to delete their own cancelled orders
CREATE POLICY "Users can delete own cancelled orders"
ON public.orders
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'cancelled');

-- Allow users to delete order items of their cancelled orders
CREATE POLICY "Users can delete items of cancelled orders"
ON public.order_items
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id
  AND orders.user_id = auth.uid()
  AND orders.status = 'cancelled'
));