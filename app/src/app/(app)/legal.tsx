import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

function Section({ title, children }: { title: string; children: string }) {
  const c = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.paragraph, { color: c.textMuted }]}>{children}</Text>
    </View>
  );
}

export default function LegalScreen() {
  const c = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: c.textMuted }]}>Última atualização: julho de 2026</Text>

        <Section title="Sobre o D20 Despesas">
          {
            'O D20 Despesas é uma ferramenta pessoal de controle financeiro. Ele existe pra te ajudar a anotar e entender seus próprios gastos — nada além disso. Ao continuar usando o app, você concorda com os termos descritos aqui.'
          }
        </Section>

        <Section title="Quais dados coletamos">
          {
            'Se você entra com sua conta Google, guardamos seu nome, e-mail e foto de perfil (fornecidos pelo próprio Google) para identificar sua conta. Além disso, guardamos o que você cadastra no app: despesas, categorias, metas, lembretes e parcelamentos. Não pedimos nem coletamos dados bancários, cartão de crédito ou qualquer informação financeira sensível além do que você digita manualmente.'
          }
        </Section>

        <Section title="Modo 100% offline">
          {
            'Se você optar por usar o app "sem conta", nada é enviado para nenhum servidor: todos os seus dados ficam salvos só no seu aparelho (armazenamento local), e o D20 Despesas nunca faz nenhuma chamada de rede nesse modo. A contrapartida é que, se você desinstalar o app ou trocar de aparelho sem exportar antes, esses dados se perdem — não existe cópia em nuvem.'
          }
        </Section>

        <Section title="Como usamos seus dados">
          {
            'Usamos seus dados exclusivamente para fazer o app funcionar: mostrar suas despesas, calcular seus gráficos, gerar os insights e lembretes dentro do próprio app. Não vendemos, não alugamos e não compartilhamos seus dados com terceiros para publicidade ou qualquer outra finalidade. Os únicos serviços de terceiros envolvidos são o Google (para login) e o Supabase (para hospedar o banco de dados com segurança) — nenhum dos dois tem acesso aos dados de outras contas além da sua.'
          }
        </Section>

        <Section title="Como protegemos seus dados">
          {
            'Enquanto sua conta estiver vinculada ao Google, o D20 Despesas se compromete a proteger seus dados de acordo com a Lei Geral de Proteção de Dados (LGPD). Na prática: cada conta só consegue ler e escrever os próprios dados — isso é garantido por regras de segurança no próprio banco de dados (Row Level Security), não apenas pela tela do app. Toda comunicação entre o app e o servidor é criptografada (HTTPS). Nenhuma senha ou chave sensível fica guardada no aplicativo.'
          }
        </Section>

        <Section title="Seus direitos (LGPD)">
          {
            'A qualquer momento, você pode acessar, corrigir ou apagar os seus dados diretamente pelo app — sem precisar pedir pra ninguém. Vá em Configurações: lá você encontra a opção de excluir todas as suas despesas, ou excluir todos os seus dados de uma vez (despesas e metas) e sair da conta. Essas ações são permanentes e não podem ser desfeitas. Se preferir, você também pode simplesmente sair da conta a qualquer momento, sem apagar nada.'
          }
        </Section>

        <Section title="Por quanto tempo guardamos seus dados">
          {
            'Seus dados ficam guardados enquanto sua conta existir e você não pedir a exclusão. Ao excluir despesas, metas, lembretes ou parcelamentos pelo app, eles são removidos permanentemente do banco de dados — não mantemos cópias ocultas ou backups posteriores à exclusão.'
          }
        </Section>

        <Section title="Responsabilidade">
          {
            'O D20 Despesas é uma ferramenta de anotação e organização financeira pessoal — ele não é consultoria financeira, contábil ou de investimentos, e os cálculos e insights mostrados são apenas informativos, baseados no que você mesmo cadastrou. O uso do app é por sua conta e risco quanto a decisões financeiras.'
          }
        </Section>

        <Section title="Mudanças nestes termos">
          {
            'Se estes termos mudarem, a atualização será refletida nesta mesma tela, com a data no topo atualizada. Recomendamos revisitar esta página de vez em quando.'
          }
        </Section>

        <Section title="Contato">
          {
            'Dúvidas, pedidos de exclusão de dados ou qualquer outra questão sobre privacidade podem ser enviados para joaumvictor.oficial@gmail.com.'
          }
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 64 },
  updated: { ...type.caption, marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...type.heading, marginBottom: spacing.sm },
  paragraph: { ...type.body, lineHeight: 22 },
});
