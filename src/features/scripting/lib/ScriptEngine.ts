import { DocCollection, Schema, type Doc } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';
import { PageEditor } from '@blocksuite/presets';

export class ScriptEngine {
  private static instance: ScriptEngine;
  private collection: DocCollection | null = null;
  private editor: PageEditor | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ScriptEngine {
    if (!ScriptEngine.instance) {
      ScriptEngine.instance = new ScriptEngine();
    }
    return ScriptEngine.instance;
  }

  public initialize() {
    if (this.isInitialized) return;

    console.log('ScriptEngine: Initializing BlockSuite...');
    
    // 1. Initialize Schema & Collection
    const schema = new Schema().register(AffineSchemas);
    this.collection = new DocCollection({ schema });
    this.collection.meta.initialize();

    // 2. Initialize Singleton Editor
    this.editor = document.createElement('page-editor') as PageEditor;
    
    this.isInitialized = true;
  }

  public getCollection(): DocCollection {
    if (!this.collection) {
      this.initialize();
    }
    return this.collection!;
  }

  public getEditor(): PageEditor {
    if (!this.editor) {
      this.initialize();
    }
    return this.editor!;
  }

  public createDoc(title: string, content: string = ''): Doc {
    const collection = this.getCollection();
    const doc = collection.createDoc();
    
    this.initDocHierarchy(doc, title, content);
    return doc;
  }

  public getDoc(docId: string): Doc | undefined {
    return this.getCollection().getDoc(docId) || undefined;
  }

  public mountEditor(doc: Doc) {
    const editor = this.getEditor();
    if (editor.doc !== doc) {
      editor.doc = doc;
    }
  }

  private initDocHierarchy(doc: Doc, title: string = '', content: string = '') {
    doc.load(() => {
      const pageBlockId = doc.addBlock('affine:page', {
        title: new doc.Text(title),
      });
      doc.addBlock('affine:surface', {}, pageBlockId);
      const noteId = doc.addBlock('affine:note', {}, pageBlockId);
      doc.addBlock('affine:paragraph', {
        text: new doc.Text(content),
      }, noteId);
    });
  }

  public applyPreset(name: string, structure: { type: string; content: string }[]): Doc {
    const doc = this.getCollection().createDoc();
    
    doc.load(() => {
      const pageBlockId = doc.addBlock('affine:page', {
        title: new doc.Text(name),
      });
      doc.addBlock('affine:surface', {}, pageBlockId);
      const noteId = doc.addBlock('affine:note', {}, pageBlockId);
      
      structure.forEach(item => {
        if (item.type === 'heading') {
          doc.addBlock('affine:paragraph', {
            text: new doc.Text(item.content),
            type: 'h2'
          }, noteId);
        } else {
          doc.addBlock('affine:paragraph', {
            text: new doc.Text(item.content),
          }, noteId);
        }
      });
    });

    return doc;
  }
}
