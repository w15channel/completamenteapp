// Script para analisar e recuperar funcionalidades perdidas do projeto
// Este script irá analisar os commits e identificar funções que foram removidas

const fs = require('fs');
const { execSync } = require('child_process');

class FunctionRecoveryAnalyzer {
    constructor() {
        this.lostFunctions = [];
        this.currentFunctions = new Set();
        this.historicalFunctions = new Set();
        this.recoveryPlan = [];
    }

    // Analisar commits para encontrar funções que foram removidas
    async analyzeCommits() {
        console.log("🔍 Analisando commits para encontrar funcionalidades perdidas...");
        
        try {
            // Obter todos os commits
            const commits = execSync('git log --oneline --all', { encoding: 'utf8' })
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.split(' ')[0]);

            console.log(`📊 Encontrados ${commits.length} commits para analisar`);

            // Analisar commits mais antigos primeiro
            for (let i = commits.length - 1; i >= Math.max(0, commits.length - 20); i--) {
                const commit = commits[i];
                await this.analyzeCommit(commit);
            }

            // Identificar funções perdidas
            this.identifyLostFunctions();
            
            // Gerar plano de recuperação
            this.generateRecoveryPlan();

        } catch (error) {
            console.error("❌ Erro na análise:", error.message);
        }
    }

    async analyzeCommit(commit) {
        try {
            console.log(`🔍 Analisando commit: ${commit}`);
            
            // Verificar se há mudanças no app.js
            const filesChanged = execSync(`git show --name-only ${commit}`, { encoding: 'utf8' });
            
            if (filesChanged.includes('js/app.js')) {
                // Extrair funções do commit
                const content = execSync(`git show ${commit}:js/app.js`, { encoding: 'utf8' });
                const functions = this.extractFunctions(content);
                
                if (this.historicalFunctions.size === 0) {
                    // Primeiro commit analisado - base histórica
                    functions.forEach(func => this.historicalFunctions.add(func));
                } else {
                    // Adicionar ao conjunto histórico
                    functions.forEach(func => this.historicalFunctions.add(func));
                }
            }
        } catch (error) {
            // Ignorar erros em commits que não têm app.js
        }
    }

    extractFunctions(content) {
        const functions = new Set();
        
        // Regex para encontrar funções window.nomeFuncao
        const windowFunctionRegex = /window\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
        let match;
        
        while ((match = windowFunctionRegex.exec(content)) !== null) {
            functions.add(match[1]);
        }
        
        // Regex para encontrar funções function nomeFuncao
        const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        
        while ((match = functionRegex.exec(content)) !== null) {
            functions.add(match[1]);
        }
        
        return Array.from(functions);
    }

    analyzeCurrentCode() {
        console.log("📋 Analisando código atual...");
        
        try {
            const currentContent = fs.readFileSync('js/app.js', 'utf8');
            const currentFunctions = this.extractFunctions(currentContent);
            
            currentFunctions.forEach(func => this.currentFunctions.add(func));
            
            console.log(`✅ Encontradas ${currentFunctions.length} funções no código atual`);
            
        } catch (error) {
            console.error("❌ Erro ao ler código atual:", error.message);
        }
    }

    identifyLostFunctions() {
        console.log("🔍 Identificando funções perdidas...");
        
        // Funções que existiam historicamente mas não existem mais
        const lost = Array.from(this.historicalFunctions).filter(
            func => !this.currentFunctions.has(func)
        );
        
        this.lostFunctions = lost;
        
        console.log(`⚠️ Encontradas ${lost.length} funções potencialmente perdidas:`);
        lost.forEach(func => console.log(`   - ${func}`));
    }

    generateRecoveryPlan() {
        console.log("📋 Gerando plano de recuperação...");
        
        this.recoveryPlan = [
            {
                priority: 'HIGH',
                description: 'Analisar funções críticas perdidas',
                functions: this.lostFunctions.filter(f => 
                    f.includes('render') || 
                    f.includes('init') || 
                    f.includes('add') ||
                    f.includes('save')
                ),
                action: 'Verificar se estas funções são necessárias e restaurá-las'
            },
            {
                priority: 'MEDIUM',
                description: 'Verificar funções de utilidade',
                functions: this.lostFunctions.filter(f => 
                    f.includes('get') || 
                    f.includes('set') ||
                    f.includes('update')
                ),
                action: 'Avaliar se estas funções são usadas em algum lugar'
            },
            {
                priority: 'LOW',
                description: 'Funções obsoletas ou experimentais',
                functions: this.lostFunctions.filter(f => 
                    !f.includes('render') && 
                    !f.includes('init') && 
                    !f.includes('add') &&
                    !f.includes('save') &&
                    !f.includes('get') &&
                    !f.includes('set') &&
                    !f.includes('update')
                ),
                action: 'Verificar se podem ser removidas permanentemente'
            }
        ];

        this.displayRecoveryPlan();
    }

    displayRecoveryPlan() {
        console.log("\n🎯 PLANO DE RECUPERAÇÃO DE FUNCIONALIDADES");
        console.log("=" .repeat(50));
        
        this.recoveryPlan.forEach((plan, index) => {
            console.log(`\n${index + 1}. ${plan.description} [${plan.priority}]`);
            console.log(`   Ação: ${plan.action}`);
            
            if (plan.functions.length > 0) {
                console.log("   Funções:");
                plan.functions.forEach(func => console.log(`     - ${func}`));
            } else {
                console.log("   Nenhuma função encontrada nesta categoria");
            }
        });
    }

    // Gerar script de recuperação automática
    generateRecoveryScript() {
        const script = `// Script de recuperação de funcionalidades perdidas
// Gerado automaticamente em ${new Date().toISOString()}

// Funções que foram identificadas como perdidas:
const lostFunctions = ${JSON.stringify(this.lostFunctions, null, 2)};

// Verificar se estas funções são realmente necessárias
// e implementá-las se for o caso

console.log("🔍 Verificando funções perdidas:", lostFunctions);

// Implementar funções críticas aqui...
`;

        fs.writeFileSync('recovery-script.js', script);
        console.log("📄 Script de recuperação gerado: recovery-script.js");
    }
}

// Executar análise
async function main() {
    const analyzer = new FunctionRecoveryAnalyzer();
    
    console.log("🚀 Iniciando análise de recuperação de funcionalidades...");
    
    // Analisar código atual
    analyzer.analyzeCurrentCode();
    
    // Analisar commits históricos
    await analyzer.analyzeCommits();
    
    // Gerar script de recuperação
    analyzer.generateRecoveryScript();
    
    console.log("\n✅ Análise concluída!");
    console.log("📋 Verifique o plano de recuperação acima e o script gerado.");
}

// Exportar para uso no Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FunctionRecoveryAnalyzer;
}

// Executar se rodado diretamente
if (typeof window === 'undefined') {
    main().catch(console.error);
}
