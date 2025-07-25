import { hashPassword } from "./auth";
import { storage } from "./storage";
import { pool } from "./db";

async function createAdmin() {
  console.log("Iniciando a criação do usuário administrador...");

  // --- Defina aqui os dados do seu administrador ---
  const adminData = {
    cpf: "000.000.000-00",
    username: "admin",
    name: "Administrador",
    password: "admin", // Senha temporária, troque se desejar
    role: "admin",
    status: "active",
  };
  // ---------------------------------------------

  try {
    const userExists = await storage.getUserByCpf(adminData.cpf);
    if (userExists) {
      console.log(`Usuário com CPF ${adminData.cpf} já existe.`);
      return;
    }

    const hashedPassword = await hashPassword(adminData.password);

    await storage.createUser({
      ...adminData,
      password: hashedPassword,
    });

    console.log("✅ Usuário administrador criado com sucesso!");
    console.log(`   Usuário: ${adminData.username}`);
    console.log(`   Senha: ${adminData.password}`);
  } catch (error) {
    console.error("❌ Erro ao criar o usuário administrador:", error);
  } finally {
    await pool.end(); // Fecha a conexão com o banco de dados
    console.log("Script finalizado.");
  }
}

createAdmin();