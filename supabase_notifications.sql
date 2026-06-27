-- ==============================================================================
-- SQL SCRIPTS PARA ENVIO DE NOTIFICAÇÕES (FINANTRA ECO IA)
-- Para executar estes comandos, copie e cole no Editor SQL (Query Editor) do seu painel Supabase.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SQL: NOTIFICAÇÃO DE "PROBLEMAS CORRIGIDOS"
-- Regra de Negócio: No site, estas notificações só podem ser excluídas a cada 3 horas.
-- ------------------------------------------------------------------------------
INSERT INTO app_maintenance (title, description, duration_hours, created_at)
VALUES (
  'Problemas corrigidos com sucesso', 
  'Identificamos oscilações pontuais na sincronização multiplataforma e todos os problemas foram corrigidos por nosso time técnico. Agradecemos a paciência!', 
  3, -- Tempo recomendado de permanência no ar antes do auto-expirar (3 horas)
  timezone('utc'::text, now())
);


-- ------------------------------------------------------------------------------
-- 2. SQL: NOTIFICAÇÃO DE "MANUTENÇÃO PRÉVIA" EM DETERMINADO HORÁRIO
-- Regra de Negócio: No site, estas notificações só podem ser excluídas a cada 1 hora.
-- Ajuste o campo 'description' com o dia e hora determinados para a manutenção futura.
-- ------------------------------------------------------------------------------
INSERT INTO app_maintenance (title, description, duration_hours, created_at)
VALUES (
  'Manutenção prévia do sistema', 
  'Aviso prévio de manutenção preventiva programada na infraestrutura do banco de dados Finantra para o dia 28/06/2026 às 04:00 (UTC). Pode haver breves instabilidades.', 
  2, -- Tempo recomendado de permanência no ar antes de auto-expirar (2 horas)
  timezone('utc'::text, now()) -- Registra no horário atual de envio
);
