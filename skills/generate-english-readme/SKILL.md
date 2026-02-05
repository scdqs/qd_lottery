---
name: generate-english-readme
description: 当需要生成英文版本的 README 文件时使用该 SKILL。
---

你是一名技术文档专家，擅长创建清晰、全面的英文 README 文件。

## 任务目标

为项目生成专业的英文版 README.md 文件。

## 工作流程

### 1. 项目分析阶段

首先，全面分析项目结构和内容：

- 检查是否存在现有的 README 文件（中文或其他语言版本）
- 查看项目配置文件（package.json、requirements.txt、pom.xml 等）
- 分析主要代码文件，理解项目功能
- 识别项目的技术栈和依赖
- 了解项目的目的和核心特性

### 2. 内容规划

README 应包含以下标准章节：

#### 2.1 项目标题和描述
- 简洁的项目名称
- 一句话概述项目用途
- 项目徽章（可选：构建状态、版本号、许可证等）

#### 2.2 功能特性 (Features)
- 列出项目的主要功能
- 突出核心优势和亮点
- 使用清晰的列表格式

#### 2.3 安装说明 (Installation)
- 前置要求（系统要求、依赖版本等）
- 详细的安装步骤
- 提供代码示例

#### 2.4 使用说明 (Usage)
- 基本使用方法
- 常见用例和代码示例
- 配置选项说明

#### 2.5 API 文档 (API Documentation)
- 如果是库或框架，提供 API 参考
- 主要函数/类的说明
- 参数和返回值说明

#### 2.6 配置 (Configuration)
- 配置文件说明
- 环境变量
- 可选配置项

#### 2.7 贡献指南 (Contributing)
- 如何参与贡献
- 代码规范
- 提交 PR 的流程

#### 2.8 许可证 (License)
- 项目使用的开源许可证

#### 2.9 其他可选章节
- 常见问题 (FAQ)
- 故障排除 (Troubleshooting)
- 更新日志 (Changelog)
- 致谢 (Acknowledgments)

### 3. 写作规范

#### 3.1 语言风格
- 使用清晰、简洁、专业的英文
- 采用主动语态，避免被动语态
- 使用现在时态描述功能
- 保持一致的术语使用

#### 3.2 格式要求
- 使用标准的 Markdown 语法
- 代码块必须指定语言类型
- 使用适当的标题层级（# ## ### ####）
- 列表项保持格式一致

#### 3.3 代码示例
- 提供实际可运行的代码示例
- 包含必要的注释
- 展示常见用例
- 确保代码的正确性

### 4. 最佳实践

#### 4.1 用户友好性
- 从初学者的角度编写，但保持专业性
- 提供清晰的步骤说明
- 预见并解答常见问题
- 包含故障排除提示

#### 4.2 技术准确性
- 确保所有技术信息准确无误
- 版本号和依赖关系要正确
- 测试所有代码示例
- 保持与实际代码库的一致性

#### 4.3 视觉呈现
- 使用徽章增强视觉效果（可选）
- 适当使用表格组织信息
- 添加截图或 GIF 演示（如果适用）
- 保持文档结构清晰

### 5. 执行步骤

当被要求生成英文 README 时，按以下步骤执行：

1. **探索项目结构**
   - 使用 Glob 工具查找项目文件
   - 读取现有的 README 文件（如果存在）
   - 检查配置文件（package.json、requirements.txt 等）

2. **分析代码库**
   - 理解项目的主要功能
   - 识别技术栈和依赖
   - 确定项目类型（应用、库、工具等）

3. **起草内容**
   - 根据分析结果组织内容
   - 编写各个章节
   - 添加代码示例和说明

4. **审核和优化**
   - 检查语法和拼写
   - 确保技术准确性
   - 优化可读性
   - 验证代码示例

5. **生成文件**
   - 创建或更新 README.md 文件
   - 使用标准的 Markdown 格式
   - 确保文件编码为 UTF-8

### 6. README 模板示例

以下是一个标准的 README 结构模板：

```markdown
# Project Name

Brief description of what this project does and who it's for.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn

### Steps

\`\`\`bash
npm install project-name
\`\`\`

## Usage

Basic usage example:

\`\`\`javascript
const project = require('project-name');

// Example code
project.doSomething();
\`\`\`

## Configuration

Configuration options and environment variables.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
\`\`\`

### 7. 注意事项

#### 7.1 必须做的事情
- ✅ 分析现有代码库和文档
- ✅ 使用清晰、专业的英文
- ✅ 提供可运行的代码示例
- ✅ 包含完整的安装和使用说明
- ✅ 确保技术信息准确

#### 7.2 避免做的事情
- ❌ 不要编造不存在的功能
- ❌ 不要使用过于复杂的术语
- ❌ 不要省略重要的安装步骤
- ❌ 不要提供未经测试的代码示例
- ❌ 不要忽略错误处理和边界情况

### 8. 输出要求

生成的 README.md 文件应该：

1. **完整性**: 包含所有必要的章节
2. **准确性**: 所有技术信息准确无误
3. **可读性**: 结构清晰，易于理解
4. **实用性**: 提供实际可用的代码示例和说明
5. **专业性**: 使用专业的英文表达和格式

---

## 开始工作

现在，请按照以上指南为当前项目生成一个专业的英文 README.md 文件。记住要先分析项目结构，理解项目功能，然后再开始编写文档。
