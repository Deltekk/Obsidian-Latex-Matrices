import { create } from 'domain';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, EditorPosition  } from 'obsidian';

interface LatexMatricesSettings {
	latexMatricesSettings: string;
}

const DEFAULT_SETTINGS: LatexMatricesSettings = {
	latexMatricesSettings: 'default'
}

export default class LatexMatrices extends Plugin {
	settings: LatexMatricesSettings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-matrix-modal',
			name: 'Create new matrix',
			editorCallback: (editor: Editor) => {
				new MatrixModal(this.app, editor).open();
			}
		});

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MatrixModal extends Modal {

	private editor: Editor;

	constructor(app: App, editor: Editor) {
		super(app);
		this.editor = editor;
	}

	onOpen() {

		const {contentEl} = this;
		let bracketLeftChar = "";
		let bracketRightChar = "";

		let myapp = this.app;
		
		contentEl.createEl("h2", {
			text: "Create new matrix",
			cls: "matrixHeader",
		});

		//----- HEIGHT & WIDTH INPUTS -----//

		const widthInput = contentEl.createEl("input", {
			type: "Number",
			placeholder: "Insert width",
			cls: "matrixInput",
		});

		const heightInput = contentEl.createEl("input", {
			type: "Number",
			placeholder: "Insert height",
			cls: "matrixInput",
		});

		//----- BRACKETS INPUTS AND OPTIONS -----//

		const bracketsInput = contentEl.createEl("select", {
			type: "select",
			cls: "matrixInput",
		});

		const placeholderBracket = contentEl.createEl("option", {
			text: "Select brackets",
			value: " ",
		});

		const noBrackets = contentEl.createEl("option", {
			text: "None Brackets",
			value: "N",
		});

		const roundBracket = contentEl.createEl("option", {
			text: "Round Brackets",
			value: "R",
		});

		const squareBrackets = contentEl.createEl("option", {
			text: "Square Brackets",
			value: "S",
		});

		const curlyBracket = contentEl.createEl("option", {
			text: "Curly Brackets",
			value: "C",
		});

		//----- MODAL GUI CREATION -----//

		const br = contentEl.createEl("br");

		contentEl.appendChild(widthInput);
		contentEl.appendChild(heightInput);

		contentEl.appendChild(bracketsInput);
		bracketsInput.appendChild(placeholderBracket);
		bracketsInput.appendChild(noBrackets);
		bracketsInput.appendChild(roundBracket);
		bracketsInput.appendChild(squareBrackets);
		bracketsInput.appendChild(curlyBracket);

		contentEl.appendChild(br);

		const generateBtn = contentEl.createEl("button", {
			text: "Generate matrix",
			cls: "genBtn",
		});

		const errorPar = contentEl.createEl("p", {
			text: "Please, set the height, the width and the type of brackets you wish to use.",
			cls: "disabled",
		});

		contentEl.appendChild(generateBtn);
		contentEl.appendChild(errorPar);

		generateBtn.addEventListener("click", generateMatrix);
		bracketsInput.addEventListener("change", onChangeBrackets);

		contentEl.appendChild(br);

		let matrixDiv = contentEl.createEl("div", {
			cls: "matrixDiv",
		});

		contentEl.appendChild(matrixDiv);

		//----- On Change Brackets -----//

		function onChangeBrackets() {
			switch (bracketsInput.value) {
				case "R":
					bracketLeftChar = "(";
					bracketRightChar = ")";
					break;

				case "N":
					bracketLeftChar = " ";
					bracketRightChar = " ";
					break;

				case "S":
					bracketLeftChar = "[";
					bracketRightChar = "]";
					break;

				case "C":
					bracketLeftChar = "\\{";
					bracketRightChar = "\\}";
					break;

				default:
					bracketLeftChar = "(";
					bracketRightChar = ")";
					break;
			}
		}

		//----- GENERATE MATRIX -----//

		function generateMatrix() {
			let mDiv = document.getElementsByClassName("matrixDiv")[0];

			mDiv.innerHTML = "";

			if (
				Number(widthInput.value) < 1 ||
				Number(heightInput.value) < 1 ||
				bracketsInput.value == " "
			) {
				errorPar.classList.add("error");
				errorPar.classList.remove("disabled");
				return;
			}

			errorPar.classList.add("disabled");
			errorPar.classList.remove("error");

			for (let i = 0; i < Number(heightInput.value); i++) {
				let innerMatrixDiv = contentEl.createEl("div", {
					cls: "innerMatrixDiv",
				});

				for (let j = 0; j < Number(widthInput.value); j++) {
					let cell = contentEl.createEl("input", {
						attr: { id: `matrix${i}${j}` },
						type: "text",
						cls: "matrixElement",
					});

					innerMatrixDiv.appendChild(cell);
				}

				mDiv.append(innerMatrixDiv);
			}			

			let createBtn = contentEl.createEl("button", {
				text: "Write latex",
				cls: "genBtn",
			});

			mDiv.appendChild(createBtn);

			createBtn.addEventListener("click", outputLatex);
		}

		//----- PRINT MATRIX -----//

		function outputLatex() {
			let matriceFinale = "";

			if (bracketsInput.value != "N") {
				matriceFinale += `\\left${bracketLeftChar}\\begin{matrix} `;
			} else {
				matriceFinale += `\\begin{matrix} `;
			}

			for (let i = 0; i < Number(heightInput.value); i++) {
				for (let j = 0; j < Number(widthInput.value); j++) {
					let cell: HTMLInputElement = document.getElementById(
						`matrix${i}${j}`
					) as HTMLInputElement;

					if (cell != null)
					{
						if(cell.value.includes("/"))
						{
							let arr = cell.value.split("/");
							matriceFinale += `\\frac{${arr[0]}}{${arr[1]}}`;	
						}
						else
						{
							matriceFinale += cell.value;	
						}
					}

					if (j != Number(widthInput.value) - 1) {
						matriceFinale += " & ";
					}
				}

				if (i != Number(heightInput.value) - 1)
					matriceFinale += " \\\\ ";
			}

			if (bracketsInput.value != "N") {
				matriceFinale += `\\end{matrix} \\right${bracketRightChar}`;
			} else {
				matriceFinale += `\\end{matrix}`;
			};

			let editor = myapp.workspace.activeEditor?.editor;
			editor?.replaceRange(matriceFinale, editor.getCursor());

		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
