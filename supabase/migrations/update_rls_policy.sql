-- 更新服务器配置表的行级安全策略
DROP POLICY IF EXISTS "Server configs are accessible by authenticated users" ON server_configs;
DROP POLICY IF EXISTS "Server configs are accessible by anon users" ON server_configs;

-- 创建策略允许匿名用户对服务器配置进行所有操作
CREATE POLICY "Server configs are accessible by anon users"
  ON server_configs
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 更新验证记录表的行级安全策略
DROP POLICY IF EXISTS "Verification records are accessible by authenticated users" ON verification_records;
DROP POLICY IF EXISTS "Verification records are accessible by anon users" ON verification_records;

-- 创建策略允许匿名用户对验证记录进行所有操作
CREATE POLICY "Verification records are accessible by anon users"
  ON verification_records
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true); 