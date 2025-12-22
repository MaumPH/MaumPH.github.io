"""
프로그램 반응 AI 생성기 v5.0
- 고도화된 프롬프트 엔지니어링
- 감정 표현 다양화 (즐거움, 호기심, 집중, 피로 등)
- 개인별 특성 반영 (인지 수준, 신체 능력, 사회성)
- 더 구체적이고 현실적인 반응 생성
"""
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import json
import requests
import os
import sys
import time
import threading

class ReactionGeneratorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("프로그램 반응 AI 생성기 v5.0")
        self.root.geometry("1100x900")
        self.root.resizable(True, True)
        
        # 설정 파일 경로
        self.config_file = self.get_config_path()
        
        # Gemini 모델 목록
        self.gemini_models = {
            "Gemini 3.0 Flash Preview (최신, 가장 강력)": "gemini-3-flash-preview",
            "Gemini 2.5 Flash (빠름, 안정적)": "gemini-2.5-flash"
        }
        
        # 데이터 로드
        self.program_data = self.load_program_data()
        self.program_names = sorted(self.program_data.keys())
        self.filtered_programs = self.program_names.copy()

        # 감정 가이드 로드
        self.emotion_guide = self.load_emotion_guide()

        # 생성 관련 변수
        self.generation_start_time = None
        self.timer_running = False
        
        # UI 구성
        self.create_widgets()
        
        # 저장된 설정 불러오기
        self.load_saved_config()
    
    def get_config_path(self):
        """설정 파일 경로 가져오기"""
        if getattr(sys, 'frozen', False):
            app_dir = os.path.dirname(sys.executable)
        else:
            app_dir = os.path.dirname(__file__)
        
        return os.path.join(app_dir, 'config.json')
    
    def load_saved_config(self):
        """저장된 설정 불러오기"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)

                    if 'api_key' in config:
                        self.api_key_var.set(config['api_key'])
                        self.save_key_var.set(True)

                    if 'model' in config and config['model'] in self.gemini_models.keys():
                        self.model_var.set(config['model'])

                    # 감정 비율 로드
                    if 'positive_ratio' in config:
                        self.positive_ratio_var.set(config['positive_ratio'])
                    if 'neutral_ratio' in config:
                        self.neutral_ratio_var.set(config['neutral_ratio'])
                    if 'negative_ratio' in config:
                        self.negative_ratio_var.set(config['negative_ratio'])

                    # 비율 합계 표시 업데이트
                    self.on_ratio_changed()
        except Exception as e:
            pass
    
    def save_config(self):
        """설정 저장"""
        try:
            config = {
                'api_key': self.api_key_var.get(),
                'model': self.model_var.get(),
                'positive_ratio': self.positive_ratio_var.get(),
                'neutral_ratio': self.neutral_ratio_var.get(),
                'negative_ratio': self.negative_ratio_var.get()
            }

            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            pass
    
    def delete_config(self):
        """저장된 설정 삭제"""
        try:
            if os.path.exists(self.config_file):
                os.remove(self.config_file)
        except Exception as e:
            pass
        
    def load_program_data(self):
        """JSON 데이터 로드"""
        try:
            if getattr(sys, 'frozen', False):
                base_path = sys._MEIPASS
            else:
                base_path = os.path.dirname(__file__)

            json_path = os.path.join(base_path, 'program_data.json')

            with open(json_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            messagebox.showerror("오류", f"데이터 파일을 불러올 수 없습니다:\n{e}")
            return {}

    def load_emotion_guide(self):
        """감정 가이드 JSON 로드"""
        try:
            if getattr(sys, 'frozen', False):
                base_path = sys._MEIPASS
            else:
                base_path = os.path.dirname(__file__)

            # 먼저 작은 파일로 시도
            json_path = os.path.join(base_path, 'emotion_guide.json')
            if not os.path.exists(json_path):
                json_path = os.path.join(base_path, 'emotion_guide_merged.json')

            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data
        except Exception as e:
            # 에러 메시지 표시하지 않고 빈 딕셔너리 반환 (폴백 사용)
            return {}

    def create_widgets(self):
        """UI 요소 생성"""
        # 메인 프레임
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        
        # 타이틀
        title_frame = ttk.Frame(main_frame)
        title_frame.grid(row=0, column=0, columnspan=2, pady=(0, 15))
        
        title_label = ttk.Label(
            title_frame,
            text="🤖 프로그램 반응 AI 생성기 v5.0",
            font=("맑은 고딕", 18, "bold")
        )
        title_label.pack()

        subtitle_label = ttk.Label(
            title_frame,
            text="고도화된 AI 프롬프트 | 감정·특성 반영 | Gemini API 기반",
            font=("맑은 고딕", 9)
        )
        subtitle_label.pack()
        
        row = 1
        
        # 상단 설정 프레임
        settings_frame = ttk.LabelFrame(main_frame, text="⚙️ 기본 설정", padding="10")
        settings_frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # API 키
        api_row = ttk.Frame(settings_frame)
        api_row.pack(fill=tk.X, pady=5)
        
        ttk.Label(api_row, text="API 키:", width=12, font=("맑은 고딕", 9, "bold")).pack(side=tk.LEFT)
        
        self.api_key_var = tk.StringVar()
        api_entry = ttk.Entry(api_row, textvariable=self.api_key_var, width=50, show="*")
        api_entry.pack(side=tk.LEFT, padx=5)
        
        self.save_key_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(
            api_row, 
            text="저장", 
            variable=self.save_key_var,
            command=self.on_save_key_changed
        ).pack(side=tk.LEFT, padx=5)
        
        ttk.Label(
            api_row,
            text="💡 https://aistudio.google.com/app/apikey",
            font=("맑은 고딕", 8),
            foreground="blue"
        ).pack(side=tk.LEFT, padx=10)
        
        # 모델 선택
        model_row = ttk.Frame(settings_frame)
        model_row.pack(fill=tk.X, pady=5)
        
        ttk.Label(model_row, text="AI 모델:", width=12, font=("맑은 고딕", 9, "bold")).pack(side=tk.LEFT)
        
        self.model_var = tk.StringVar(value="Gemini 3.0 Flash Preview (최신, 가장 강력)")
        model_combo = ttk.Combobox(
            model_row,
            textvariable=self.model_var,
            values=list(self.gemini_models.keys()),
            width=48,
            state="readonly"
        )
        model_combo.pack(side=tk.LEFT, padx=5)
        
        # 생성 개수
        count_row = ttk.Frame(settings_frame)
        count_row.pack(fill=tk.X, pady=5)
        
        ttk.Label(count_row, text="생성 개수:", width=12, font=("맑은 고딕", 9, "bold")).pack(side=tk.LEFT)
        
        self.count_var = tk.IntVar(value=10)
        ttk.Spinbox(
            count_row,
            from_=1,
            to=50,
            textvariable=self.count_var,
            width=10
        ).pack(side=tk.LEFT, padx=5)
        
        ttk.Label(count_row, text="(1~50개)", font=("맑은 고딕", 8)).pack(side=tk.LEFT)

        # 감정 비율 조정
        ratio_row = ttk.Frame(settings_frame)
        ratio_row.pack(fill=tk.X, pady=5)

        ttk.Label(ratio_row, text="감정 비율:", width=12, font=("맑은 고딕", 9, "bold")).pack(side=tk.LEFT)

        # 긍정 비율
        ttk.Label(ratio_row, text="긍정", font=("맑은 고딕", 8)).pack(side=tk.LEFT, padx=(5, 2))
        self.positive_ratio_var = tk.IntVar(value=50)
        ttk.Spinbox(
            ratio_row,
            from_=0,
            to=100,
            textvariable=self.positive_ratio_var,
            width=5,
            command=self.on_ratio_changed
        ).pack(side=tk.LEFT)
        ttk.Label(ratio_row, text="%", font=("맑은 고딕", 8)).pack(side=tk.LEFT, padx=(0, 10))

        # 중립 비율
        ttk.Label(ratio_row, text="중립", font=("맑은 고딕", 8)).pack(side=tk.LEFT, padx=(0, 2))
        self.neutral_ratio_var = tk.IntVar(value=30)
        ttk.Spinbox(
            ratio_row,
            from_=0,
            to=100,
            textvariable=self.neutral_ratio_var,
            width=5,
            command=self.on_ratio_changed
        ).pack(side=tk.LEFT)
        ttk.Label(ratio_row, text="%", font=("맑은 고딕", 8)).pack(side=tk.LEFT, padx=(0, 10))

        # 소극/피로 비율
        ttk.Label(ratio_row, text="소극/피로", font=("맑은 고딕", 8)).pack(side=tk.LEFT, padx=(0, 2))
        self.negative_ratio_var = tk.IntVar(value=20)
        ttk.Spinbox(
            ratio_row,
            from_=0,
            to=100,
            textvariable=self.negative_ratio_var,
            width=5,
            command=self.on_ratio_changed
        ).pack(side=tk.LEFT)
        ttk.Label(ratio_row, text="%", font=("맑은 고딕", 8)).pack(side=tk.LEFT)

        # 비율 합계 표시
        self.ratio_sum_label = ttk.Label(ratio_row, text="(합계: 100%)", font=("맑은 고딕", 8), foreground="green")
        self.ratio_sum_label.pack(side=tk.LEFT, padx=(10, 0))

        row += 1
        
        # 모드 선택 프레임
        mode_frame = ttk.Frame(main_frame)
        mode_frame.grid(row=row, column=0, columnspan=2, pady=(0, 10))
        
        self.mode_var = tk.StringVar(value="existing")
        
        ttk.Radiobutton(
            mode_frame,
            text="◉ 기존 프로그램",
            variable=self.mode_var,
            value="existing",
            command=self.on_mode_changed
        ).pack(side=tk.LEFT, padx=20)
        
        ttk.Radiobutton(
            mode_frame,
            text="○ 신규 프로그램",
            variable=self.mode_var,
            value="new",
            command=self.on_mode_changed
        ).pack(side=tk.LEFT, padx=20)
        
        row += 1
        
        # 좌우 분할 프레임
        content_frame = ttk.Frame(main_frame)
        content_frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 15))
        content_frame.columnconfigure(0, weight=1)
        content_frame.columnconfigure(1, weight=1)
        
        # 왼쪽: 기존 프로그램
        self.existing_frame = ttk.LabelFrame(
            content_frame,
            text="📚 기존 프로그램 선택",
            padding="10"
        )
        self.existing_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 5))
        
        # 검색
        search_frame = ttk.Frame(self.existing_frame)
        search_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(search_frame, text="🔍 검색:", font=("맑은 고딕", 9, "bold")).pack(side=tk.LEFT)
        
        self.search_var = tk.StringVar()
        self.search_var.trace('w', self.on_search_changed)
        search_entry = ttk.Entry(search_frame, textvariable=self.search_var)
        search_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        
        ttk.Button(search_frame, text="✖", width=3, command=self.clear_search).pack(side=tk.LEFT)
        
        # 프로그램 목록
        ttk.Label(
            self.existing_frame,
            text=f"프로그램 목록 ({len(self.program_names)}개)",
            font=("맑은 고딕", 9, "bold")
        ).pack(anchor=tk.W, pady=(5, 5))
        
        listbox_frame = ttk.Frame(self.existing_frame)
        listbox_frame.pack(fill=tk.BOTH, expand=True)
        
        scrollbar = ttk.Scrollbar(listbox_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.program_listbox = tk.Listbox(
            listbox_frame,
            height=12,
            font=("맑은 고딕", 9),
            yscrollcommand=scrollbar.set,
            selectmode=tk.SINGLE
        )
        self.program_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.program_listbox.yview)
        
        self.update_program_list()
        self.program_listbox.bind('<<ListboxSelect>>', self.on_program_selected)
        
        # 선택 정보
        self.existing_info_label = ttk.Label(
            self.existing_frame,
            text="선택된 프로그램: 없음",
            font=("맑은 고딕", 8),
            foreground="gray"
        )
        self.existing_info_label.pack(pady=(10, 0))
        
        # 오른쪽: 신규 프로그램
        self.new_frame = ttk.LabelFrame(
            content_frame,
            text="✨ 신규 프로그램 입력",
            padding="10"
        )
        self.new_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(5, 0))
        
        # 프로그램 제목
        ttk.Label(
            self.new_frame,
            text="📌 프로그램 제목:",
            font=("맑은 고딕", 9, "bold")
        ).pack(anchor=tk.W, pady=(0, 5))
        
        self.new_title_var = tk.StringVar()
        new_title_entry = ttk.Entry(
            self.new_frame,
            textvariable=self.new_title_var,
            font=("맑은 고딕", 10)
        )
        new_title_entry.pack(fill=tk.X, pady=(0, 15))
        
        # 프로그램 설명
        ttk.Label(
            self.new_frame,
            text="📝 프로그램 설명 (어떤 프로그램인지 자세히):",
            font=("맑은 고딕", 9, "bold")
        ).pack(anchor=tk.W, pady=(0, 5))
        
        self.new_desc_text = scrolledtext.ScrolledText(
            self.new_frame,
            height=10,
            font=("맑은 고딕", 10),
            wrap=tk.WORD
        )
        self.new_desc_text.pack(fill=tk.BOTH, expand=True)
        
        # 예시 텍스트
        example_text = """예시:
- 활동 내용 (노래 부르기, 만들기, 게임 등)
- 사용 도구/재료
- 목적 (인지 향상, 소근육 운동, 정서 안정 등)
- 진행 방식"""
        
        self.new_desc_text.insert('1.0', example_text)
        self.new_desc_text.config(foreground="gray")
        
        # 포커스 이벤트
        self.new_desc_text.bind('<FocusIn>', self.on_desc_focus_in)
        self.new_desc_text.bind('<FocusOut>', self.on_desc_focus_out)
        
        row += 1
        
        # 생성 버튼
        self.generate_btn = ttk.Button(
            main_frame,
            text="🤖 AI로 반응 생성하기",
            command=self.generate_reactions
        )
        self.generate_btn.grid(row=row, column=0, columnspan=2, pady=15, sticky=(tk.W, tk.E))
        
        row += 1
        
        # 진행 상태
        progress_frame = ttk.LabelFrame(main_frame, text="⏳ 생성 진행 상황", padding="10")
        progress_frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.progress_bar = ttk.Progressbar(progress_frame, mode='indeterminate')
        self.progress_bar.pack(fill=tk.X, pady=(0, 5))
        
        self.progress_label = ttk.Label(
            progress_frame,
            text="대기 중...",
            font=("맑은 고딕", 9)
        )
        self.progress_label.pack()
        
        self.timer_label = ttk.Label(
            progress_frame,
            text="",
            font=("맑은 고딕", 8),
            foreground="gray"
        )
        self.timer_label.pack()
        
        row += 1
        
        # 결과 영역 (3분할)
        result_main_frame = ttk.LabelFrame(main_frame, text="📋 생성된 반응", padding="10")
        result_main_frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))

        # 3분할 컨테이너
        result_container = ttk.Frame(result_main_frame)
        result_container.pack(fill=tk.BOTH, expand=True)

        # 왼쪽: 긍정
        positive_frame = ttk.LabelFrame(result_container, text="😊 긍정", padding="5")
        positive_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 3))

        self.positive_text = scrolledtext.ScrolledText(
            positive_frame,
            height=20,
            font=("맑은 고딕", 9),
            wrap=tk.WORD
        )
        self.positive_text.pack(fill=tk.BOTH, expand=True)

        # 가운데: 중립
        neutral_frame = ttk.LabelFrame(result_container, text="😐 중립", padding="5")
        neutral_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S), padx=3)

        self.neutral_text = scrolledtext.ScrolledText(
            neutral_frame,
            height=20,
            font=("맑은 고딕", 9),
            wrap=tk.WORD
        )
        self.neutral_text.pack(fill=tk.BOTH, expand=True)

        # 오른쪽: 소극/피로
        negative_frame = ttk.LabelFrame(result_container, text="😔 소극/피로", padding="5")
        negative_frame.grid(row=0, column=2, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(3, 0))

        self.negative_text = scrolledtext.ScrolledText(
            negative_frame,
            height=20,
            font=("맑은 고딕", 9),
            wrap=tk.WORD
        )
        self.negative_text.pack(fill=tk.BOTH, expand=True)

        # 3분할 가중치 설정
        result_container.columnconfigure(0, weight=1)
        result_container.columnconfigure(1, weight=1)
        result_container.columnconfigure(2, weight=1)
        result_container.rowconfigure(0, weight=1)

        # 복사 버튼
        copy_btn = ttk.Button(
            result_main_frame,
            text="📋 전체 복사",
            command=self.copy_to_clipboard
        )
        copy_btn.pack(pady=(10, 0))
        
        # 그리드 가중치 - 결과 영역이 전체의 절반 크기가 되도록 조정
        main_frame.columnconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(row-1, weight=1)  # 프로그램 선택 영역 (row-1)
        main_frame.rowconfigure(row, weight=2)     # 결과 영역 (row) - 더 큰 가중치
        content_frame.rowconfigure(0, weight=1)
        
        # 초기 모드 설정
        self.on_mode_changed()
    
    def on_mode_changed(self):
        """모드 변경 시 UI 상태 업데이트"""
        mode = self.mode_var.get()
        
        if mode == "existing":
            # 기존 프로그램 활성화
            for child in self.existing_frame.winfo_children():
                self.enable_widget(child)
            self.existing_frame.config(relief=tk.GROOVE)
            
            # 신규 프로그램 비활성화
            for child in self.new_frame.winfo_children():
                self.disable_widget(child)
            self.new_frame.config(relief=tk.FLAT)
            
        else:  # new
            # 기존 프로그램 비활성화
            for child in self.existing_frame.winfo_children():
                self.disable_widget(child)
            self.existing_frame.config(relief=tk.FLAT)
            
            # 신규 프로그램 활성화
            for child in self.new_frame.winfo_children():
                self.enable_widget(child)
            self.new_frame.config(relief=tk.GROOVE)

    def on_ratio_changed(self):
        """감정 비율 변경 시 합계 확인 및 표시"""
        total = self.positive_ratio_var.get() + self.neutral_ratio_var.get() + self.negative_ratio_var.get()

        if total == 100:
            self.ratio_sum_label.config(text=f"(합계: {total}%)", foreground="green")
        else:
            self.ratio_sum_label.config(text=f"(합계: {total}% - 100%로 맞춰주세요)", foreground="red")

        # 저장 체크박스가 체크되어 있으면 설정 저장
        if hasattr(self, 'save_key_var') and self.save_key_var.get():
            self.save_config()

    def enable_widget(self, widget):
        """위젯 활성화"""
        try:
            if isinstance(widget, (ttk.Frame, ttk.LabelFrame)):
                for child in widget.winfo_children():
                    self.enable_widget(child)
            else:
                widget.config(state='normal')
        except:
            pass
    
    def disable_widget(self, widget):
        """위젯 비활성화"""
        try:
            if isinstance(widget, (ttk.Frame, ttk.LabelFrame)):
                for child in widget.winfo_children():
                    self.disable_widget(child)
            elif isinstance(widget, tk.Listbox):
                widget.config(state='disabled')
            elif isinstance(widget, scrolledtext.ScrolledText):
                widget.config(state='disabled')
            else:
                widget.config(state='disabled')
        except:
            pass
    
    def on_desc_focus_in(self, event):
        """설명 입력란 포커스 시 예시 텍스트 제거"""
        if self.new_desc_text.get('1.0', tk.END).strip().startswith("예시:"):
            self.new_desc_text.delete('1.0', tk.END)
            self.new_desc_text.config(foreground="black")
    
    def on_desc_focus_out(self, event):
        """설명 입력란 포커스 해제 시 비어있으면 예시 복원"""
        if not self.new_desc_text.get('1.0', tk.END).strip():
            example_text = """예시:
- 활동 내용 (노래 부르기, 만들기, 게임 등)
- 사용 도구/재료
- 목적 (인지 향상, 소근육 운동, 정서 안정 등)
- 진행 방식"""
            self.new_desc_text.insert('1.0', example_text)
            self.new_desc_text.config(foreground="gray")
    
    def on_save_key_changed(self):
        """저장 체크박스 변경 시"""
        if self.save_key_var.get():
            if self.api_key_var.get().strip():
                self.save_config()
        else:
            self.delete_config()
    
    def on_search_changed(self, *args):
        """검색어 변경 시 프로그램 목록 필터링"""
        search_text = self.search_var.get().lower()
        
        if not search_text:
            self.filtered_programs = self.program_names.copy()
        else:
            self.filtered_programs = [
                program for program in self.program_names
                if search_text in program.lower()
            ]
        
        self.update_program_list()
    
    def clear_search(self):
        """검색어 초기화"""
        self.search_var.set("")
    
    def update_program_list(self):
        """프로그램 리스트박스 업데이트"""
        self.program_listbox.delete(0, tk.END)
        for program in self.filtered_programs:
            self.program_listbox.insert(tk.END, program)
    
    def on_program_selected(self, event):
        """프로그램 선택 시 정보 표시"""
        selection = self.program_listbox.curselection()
        if not selection:
            self.existing_info_label.config(text="선택된 프로그램: 없음", foreground="gray")
            return
        
        program_name = self.program_listbox.get(selection[0])
        
        if program_name in self.program_data:
            data = self.program_data[program_name]
            total_records = len(data)
            
            reactions = [
                row.get('반응 및 특이사항(미참여사유)', '')
                for row in data
                if row.get('참여') == 'O' and row.get('반응 및 특이사항(미참여사유)', '').strip()
            ]
            reaction_count = len(reactions)
            
            info_text = f'선택: "{program_name}" | 기록: {total_records}개 | 참고 반응: {reaction_count}개'
            self.existing_info_label.config(text=info_text, foreground="#27ae60")
    
    def get_selected_program(self):
        """선택된 프로그램 이름 가져오기"""
        selection = self.program_listbox.curselection()
        if not selection:
            return None
        return self.program_listbox.get(selection[0])
    
    def get_example_reactions(self, program_name, max_count=30):
        """프로그램의 예시 반응 추출"""
        if program_name not in self.program_data:
            return []
        
        reactions = []
        for row in self.program_data[program_name]:
            if row.get('참여') == 'O':
                reaction = row.get('반응 및 특이사항(미참여사유)', '').strip()
                if reaction:
                    reactions.append(reaction)
                    if len(reactions) >= max_count:
                        break
        
        return reactions
    
    def update_timer(self):
        """경과 시간 업데이트"""
        while self.timer_running:
            elapsed = time.time() - self.generation_start_time
            self.timer_label.config(text=f"경과 시간: {elapsed:.1f}초")
            time.sleep(0.1)
    
    def parse_api_response(self, response_data):
        """API 응답 파싱"""
        try:
            if 'candidates' not in response_data:
                return None, "API 응답에 candidates가 없습니다."

            candidates = response_data['candidates']
            if not candidates or len(candidates) == 0:
                return None, "생성된 결과가 없습니다. (안전 필터링 가능성)"

            candidate = candidates[0]

            if 'finishReason' in candidate:
                finish_reason = candidate['finishReason']
                if finish_reason == 'SAFETY':
                    return None, "안전 필터링으로 인해 생성이 차단되었습니다."
                elif finish_reason == 'RECITATION':
                    return None, "저작권 필터링으로 인해 생성이 차단되었습니다."

            if 'content' not in candidate:
                return None, "응답에 content가 없습니다."

            content = candidate['content']

            if 'parts' not in content:
                return None, "응답에 parts가 없습니다."

            parts = content['parts']
            if not parts or len(parts) == 0:
                return None, "생성된 텍스트가 없습니다."

            if 'text' not in parts[0]:
                return None, "parts에 text가 없습니다."

            text = parts[0]['text']

            if not text or text.strip() == '':
                return None, "생성된 텍스트가 비어있습니다."

            return text, None

        except Exception as e:
            return None, f"응답 파싱 중 오류: {str(e)}"

    def parse_emotion_sections(self, generated_text):
        """생성된 텍스트를 감정별 섹션으로 분리"""
        positive = ""
        neutral = ""
        negative = ""

        try:
            lines = generated_text.strip().split('\n')
            current_section = None

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # 섹션 헤더 감지
                if '[긍정]' in line or '긍정' in line and line.startswith('['):
                    current_section = 'positive'
                    continue
                elif '[중립]' in line or '중립' in line and line.startswith('['):
                    current_section = 'neutral'
                    continue
                elif '[소극/피로]' in line or '소극' in line and line.startswith('['):
                    current_section = 'negative'
                    continue

                # 내용 추가
                if current_section == 'positive':
                    positive += line + '\n'
                elif current_section == 'neutral':
                    neutral += line + '\n'
                elif current_section == 'negative':
                    negative += line + '\n'

        except Exception as e:
            # 파싱 실패 시 모든 텍스트를 긍정에 넣음
            positive = generated_text

        return positive.strip(), neutral.strip(), negative.strip()
    
    def calculate_emotion_distribution(self, count):
        """감정별 개수 계산 (사용자 설정 비율 사용)"""
        # 비율 합계 확인
        total_ratio = self.positive_ratio_var.get() + self.neutral_ratio_var.get() + self.negative_ratio_var.get()

        if total_ratio != 100:
            # 비율 합이 100이 아니면 기본값 사용
            positive = round(count * 0.5)
            neutral = round(count * 0.3)
            negative = count - positive - neutral
        else:
            # 사용자 설정 비율 사용
            positive = round(count * self.positive_ratio_var.get() / 100)
            neutral = round(count * self.neutral_ratio_var.get() / 100)
            negative = count - positive - neutral  # 나머지를 소극/피로에 할당

        return positive, neutral, negative

    def format_emotion_expressions(self, emotion_dict, max_items_per_category=10):
        """감정 표현 딕셔너리를 문자열로 포맷팅"""
        if not emotion_dict:
            return ""

        result = []
        for category, expressions in emotion_dict.items():
            if isinstance(expressions, list) and expressions:
                # 각 카테고리에서 최대 max_items_per_category개만 사용
                items = expressions[:max_items_per_category]
                items_str = '", "'.join(items)
                result.append(f'- {category}: "{items_str}"')

        return '\n'.join(result)

    def build_advanced_prompt_existing(self, program_name, examples, count):
        """기존 프로그램을 위한 고도화된 프롬프트 생성"""
        examples_text = '\n'.join([f"{i+1}. {ex}" for i, ex in enumerate(examples[:20])])

        # 감정별 개수 계산
        positive_count, neutral_count, negative_count = self.calculate_emotion_distribution(count)

        # 감정 가이드에서 표현 추출
        positive_emotions_text = ""
        neutral_emotions_text = ""
        negative_emotions_text = ""
        cognitive_text = ""
        physical_text = ""
        social_text = ""
        program_behaviors_text = ""
        time_flow_text = ""

        if self.emotion_guide:
            # 긍정적 감정
            if "긍정적_감정" in self.emotion_guide:
                positive_emotions_text = self.format_emotion_expressions(
                    self.emotion_guide["긍정적_감정"], max_items_per_category=4
                )

            # 중립적 감정
            if "중립적_감정" in self.emotion_guide:
                neutral_emotions_text = self.format_emotion_expressions(
                    self.emotion_guide["중립적_감정"], max_items_per_category=4
                )

            # 소극적/피로 감정
            if "소극적_피로_감정" in self.emotion_guide:
                negative_emotions_text = self.format_emotion_expressions(
                    self.emotion_guide["소극적_피로_감정"], max_items_per_category=4
                )

            # 인지 수준별 표현
            if "인지_수준별_표현" in self.emotion_guide:
                cognitive_data = self.emotion_guide["인지_수준별_표현"]
                cognitive_parts = []
                for level, data in cognitive_data.items():
                    if isinstance(data, dict) and "표현" in data:
                        ratio = data.get("비율", "")
                        ratio_text = f" ({int(ratio * 100)}%)" if ratio else ""
                        items = data["표현"][:3]
                        items_str = '", "'.join(items)
                        cognitive_parts.append(f'- {level}{ratio_text}: "{items_str}"')
                cognitive_text = '\n'.join(cognitive_parts)

            # 신체 능력별 표현
            if "신체_능력별_표현" in self.emotion_guide:
                physical_data = self.emotion_guide["신체_능력별_표현"]
                physical_parts = []
                for level, data in physical_data.items():
                    if isinstance(data, dict) and "표현" in data:
                        ratio = data.get("비율", "")
                        ratio_text = f" ({int(ratio * 100)}%)" if ratio else ""
                        items = data["표현"][:3]
                        items_str = '", "'.join(items)
                        physical_parts.append(f'- {level}{ratio_text}: "{items_str}"')
                physical_text = '\n'.join(physical_parts)

            # 사회성 표현
            if "사회성_표현" in self.emotion_guide:
                social_data = self.emotion_guide["사회성_표현"]
                social_parts = []
                for level, data in social_data.items():
                    if isinstance(data, dict) and "표현" in data:
                        ratio = data.get("비율", "")
                        ratio_text = f" ({int(ratio * 100)}%)" if ratio else ""
                        items = data["표현"][:3]
                        items_str = '", "'.join(items)
                        social_parts.append(f'- {level}{ratio_text}: "{items_str}"')
                social_text = '\n'.join(social_parts)

            # 프로그램 특성별 행동
            if "프로그램_특성별_행동" in self.emotion_guide:
                program_behaviors_text = self.format_emotion_expressions(
                    self.emotion_guide["프로그램_특성별_행동"], max_items_per_category=3
                )

            # 시간 흐름 표현
            if "시간_흐름_표현" in self.emotion_guide:
                time_flow = self.emotion_guide["시간_흐름_표현"][:4]
                time_flow_text = '\n'.join([f'- "{expr}"' for expr in time_flow])

        # 폴백: 가이드가 없으면 기본 텍스트 사용
        if not positive_emotions_text:
            positive_emotions_text = """- 즐거움: "즐거워하심", "웃으시며", "기쁜 표정으로", "밝은 미소를 지으심"
- 만족감: "만족스러워하심", "뿌듯해하시는 모습", "흡족한 표정"
- 흥미/호기심: "흥미를 보이심", "호기심을 가지심", "집중하여 관찰하심"
- 성취감: "자랑스러워하심", "완성하고 기뻐하심\""""

        if not neutral_emotions_text:
            neutral_emotions_text = """- 집중: "조용히 집중하심", "묵묵히 임하심", "차분하게 참여하심"
- 관찰: "지켜보시며", "관심 있게 보심", "주의 깊게 살피심"
- 적응: "점차 익숙해지심", "천천히 따라하심\""""

        if not negative_emotions_text:
            negative_emotions_text = """- 조심스러움: "망설이시다가", "처음엔 주저하셨으나"
- 피로: "다소 피곤해하심", "중간에 휴식하심"
- 제한적 참여: "짧게 참여하심", "일부만 참여하심\""""

        if not cognitive_text:
            cognitive_text = """- 높음: "정확히 이해하시고", "능숙하게", "스스로", "기억하시며"
- 보통: "설명 듣고 따라하심", "도움받아", "함께"
- 낮음: "간단한 활동만", "지켜보시며", "부분적으로\""""

        if not physical_text:
            physical_text = """- 활동적: "적극적으로 움직이심", "빠르게", "활발히"
- 보통: "천천히", "조심스럽게", "자신의 페이스로"
- 제한적: "손동작만", "앉아서", "보조 받으며\""""

        if not social_text:
            social_text = """- 높음: "다른 어르신들과 대화하시며", "함께 웃으심", "적극적으로 교류하심"
- 보통: "옆 어르신과", "가끔 말씀하시며"
- 낮음: "조용히 혼자", "개별적으로\""""

        if not time_flow_text:
            time_flow_text = """- "초반엔 망설이시다가 점차 적극적으로 참여하심"
- "중반부터 피곤해하시며 휴식하심"
- "마지막까지 집중력을 유지하심\""""

        return f"""당신은 요양원 프로그램 운영 기록 작성 전문가입니다.

# 프로그램 정보
프로그램명: "{program_name}"

# 실제 참여자 반응 예시
{examples_text}

# 생성 목표
위 예시들의 스타일을 참고하여, "{program_name}" 프로그램에 참여한 어르신들의 반응 및 특이사항을 생성하세요.

# 감정 분포 (고정)
반응은 총 {count}개 생성하되, 아래 개수를 반드시 정확히 지키세요.
- 긍정: {positive_count}개
- 중립: {neutral_count}개
- 소극/피로: {negative_count}개

# 감정 표현 가이드

**긍정적 감정:**
{positive_emotions_text}

**중립적 감정:**
{neutral_emotions_text}

**소극적/피로 표현:**
{negative_emotions_text}

# 개인별 특성 반영 패턴
어르신의 다양한 특성을 자연스럽게 반영하세요:

**인지 수준별:**
{cognitive_text}

**신체 능력별:**
{physical_text}

**사회성별:**
{social_text}

# 프로그램 특성별 구체적 행동 표현
{program_behaviors_text if program_behaviors_text else "프로그램 유형에 맞는 구체적이고 관찰 가능한 행동 중심으로 작성"}

# 시간 흐름 및 변화 표현
프로그램 진행에 따른 자연스러운 변화:
{time_flow_text}

# 구체적 행동 표현 원칙
추상적 표현보다 관찰 가능한 구체적 행동으로:
- ❌ "좋아하심" → ✅ "박수를 치시며 즐거워하심"
- ❌ "열심히 함" → ✅ "끝까지 집중하여 완성하심"
- ❌ "관심 있음" → ✅ "질문하시며 적극적으로 참여하심"

# 출력 형식 (필수)
아래 3개 섹션으로 나누어 출력하세요. 각 섹션에는 해당 개수만큼만 숫자 리스트로 작성하세요.

[긍정]
1. ...
2. ...
(총 {positive_count}개)

[중립]
1. ...
2. ...
(총 {neutral_count}개)

[소극/피로]
1. ...
2. ...
(총 {negative_count}개)

# 작성 규칙
1. 존댓말 "~하심" 형태로 작성
2. **각 반응은 25자 이상 작성 (구체적 상황, 세부 동작, 표정 변화 등 포함)**
3. 예시와 유사한 자연스러운 톤 유지하되, 더 풍부하고 생동감 있게
4. 다양한 특성이 골고루 분포되도록 (인지 수준, 신체 능력, 사회성 모두 활용)
5. 중복되는 표현 최소화 - 각 반응마다 다른 동작, 다른 감정 표현 사용
6. **구체성 강화**: "즐거워하심" → "박수 치시며 '재미있다'고 말씀하시며 웃으심"
7. **세부 묘사 추가**: 어르신의 말, 표정, 몸짓, 다른 사람과의 상호작용 포함
8. 섹션 제목([긍정], [중립], [소극/피로])은 반드시 포함
9. 섹션별 개수 불일치 시, 스스로 수정해서 맞춘 뒤 최종 출력
10. 다른 설명/서문 금지"""

    def build_advanced_prompt_new(self, new_title, new_desc, count):
        """신규 프로그램을 위한 고도화된 프롬프트 생성"""
        # 감정별 개수 계산
        positive_count, neutral_count, negative_count = self.calculate_emotion_distribution(count)

        # 감정 가이드에서 표현 추출 (기존 프로그램과 동일한 로직)
        positive_emotions_text = ""
        neutral_emotions_text = ""
        negative_emotions_text = ""
        cognitive_text = ""
        physical_text = ""
        social_text = ""
        program_behaviors_text = ""
        time_flow_text = ""

        if self.emotion_guide:
            # 긍정적 감정
            if "긍정적_감정" in self.emotion_guide:
                positive_emotions_text = self.format_emotion_expressions(
                    self.emotion_guide["긍정적_감정"], max_items_per_category=4
                )

            # 중립적 감정
            if "중립적_감정" in self.emotion_guide:
                neutral_emotions_text = self.format_emotion_expressions(
                    self.emotion_guide["중립적_감정"], max_items_per_category=4
                )

            # 소극적/피로 감정
            if "소극적_피로_감정" in self.emotion_guide:
                negative_emotions_text = self.format_emotion_expressions(
                    self.emotion_guide["소극적_피로_감정"], max_items_per_category=4
                )

            # 인지 수준별 표현
            if "인지_수준별_표현" in self.emotion_guide:
                cognitive_data = self.emotion_guide["인지_수준별_표현"]
                cognitive_parts = []
                for level, data in cognitive_data.items():
                    if isinstance(data, dict) and "표현" in data:
                        ratio = data.get("비율", "")
                        ratio_text = f" ({int(ratio * 100)}%)" if ratio else ""
                        items = data["표현"][:3]
                        items_str = '", "'.join(items)
                        cognitive_parts.append(f'- {level}{ratio_text}: "{items_str}"')
                cognitive_text = '\n'.join(cognitive_parts)

            # 신체 능력별 표현
            if "신체_능력별_표현" in self.emotion_guide:
                physical_data = self.emotion_guide["신체_능력별_표현"]
                physical_parts = []
                for level, data in physical_data.items():
                    if isinstance(data, dict) and "표현" in data:
                        ratio = data.get("비율", "")
                        ratio_text = f" ({int(ratio * 100)}%)" if ratio else ""
                        items = data["표현"][:3]
                        items_str = '", "'.join(items)
                        physical_parts.append(f'- {level}{ratio_text}: "{items_str}"')
                physical_text = '\n'.join(physical_parts)

            # 사회성 표현
            if "사회성_표현" in self.emotion_guide:
                social_data = self.emotion_guide["사회성_표현"]
                social_parts = []
                for level, data in social_data.items():
                    if isinstance(data, dict) and "표현" in data:
                        ratio = data.get("비율", "")
                        ratio_text = f" ({int(ratio * 100)}%)" if ratio else ""
                        items = data["표현"][:3]
                        items_str = '", "'.join(items)
                        social_parts.append(f'- {level}{ratio_text}: "{items_str}"')
                social_text = '\n'.join(social_parts)

            # 프로그램 특성별 행동
            if "프로그램_특성별_행동" in self.emotion_guide:
                program_behaviors_text = self.format_emotion_expressions(
                    self.emotion_guide["프로그램_특성별_행동"], max_items_per_category=3
                )

            # 시간 흐름 표현
            if "시간_흐름_표현" in self.emotion_guide:
                time_flow = self.emotion_guide["시간_흐름_표현"][:4]
                time_flow_text = '\n'.join([f'- "{expr}"' for expr in time_flow])

        # 폴백: 가이드가 없으면 기본 텍스트 사용
        if not positive_emotions_text:
            positive_emotions_text = """- 즐거움: "즐거워하심", "웃으시며", "기쁜 표정으로", "밝은 미소 지으심", "환하게 웃으심"
- 만족감: "만족스러워하심", "뿌듯해하심", "흡족한 표정으로", "성취감을 느끼심"
- 흥미/호기심: "흥미롭게 보심", "호기심 가지심", "신기해하심", "관심 보이심"
- 열정: "적극적으로", "열심히", "집중하여", "몰입하심\""""

        if not neutral_emotions_text:
            neutral_emotions_text = """- 집중: "조용히 집중하심", "묵묵히 임하심", "차분하게 참여하심", "꾸준히 하심"
- 관찰: "지켜보시며", "주의 깊게 살피심", "관심 있게 보심"
- 적응: "점차 익숙해지심", "천천히 따라하심", "자신의 속도로 하심\""""

        if not negative_emotions_text:
            negative_emotions_text = """- 조심스러움: "망설이시다가", "처음엔 주저하셨으나", "소극적이시다가"
- 피로: "다소 피곤해하심", "중간에 휴식 취하심", "짧게 참여하심"
- 제한적 참여: "일부만 참여하심", "관람만 하심", "보조 받아 참여하심\""""

        if not cognitive_text:
            cognitive_text = """- 높음 (30%): "정확히 이해하시고 능숙하게 하심", "스스로 방법을 찾아 진행하심", "이전 활동을 기억하시며 참여하심"
- 보통 (50%): "설명 듣고 잘 따라하심", "도움받아 완성하심", "요양쌤과 함께 진행하심"
- 낮음 (20%): "간단한 활동만 참여하심", "지켜보시며 즐거워하심", "부분적으로 참여하심\""""

        if not physical_text:
            physical_text = """- 활동적 (40%): "적극적으로 움직이심", "빠르게 완성하심", "활발히 참여하심"
- 보통 (40%): "천천히 조심스럽게 하심", "자신의 페이스로 진행하심", "안정적으로 참여하심"
- 제한적 (20%): "손동작만 참여하심", "앉아서 할 수 있는 부분만 하심", "보조 도구 사용하여 참여하심\""""

        if not social_text:
            social_text = """- 사교적 (40%): "다른 어르신들과 즐겁게 대화하시며 참여하심", "옆 어르신을 도우시며 함께하심"
- 보통 (40%): "가끔 옆 어르신과 이야기 나누심", "조용히 개별적으로 참여하심"
- 내향적 (20%): "혼자 조용히 집중하심", "묵묵히 자신의 활동에만 몰두하심\""""

        if not program_behaviors_text:
            program_behaviors_text = """- 신체_활동: "스트레칭하시며", "박수 치심", "율동 따라하심", "걸으시며"
- 인지_활동: "문제 풀어보시며", "기억하시며", "답 맞히시고 기뻐하심", "생각하는 표정"
- 미술_만들기: "색칠하시며", "오리시며", "붙이시며", "완성작 보시고 만족하심"
- 음악: "노래 부르심", "박자 맞추심", "따라 부르심", "손뼉 치시며"
- 게임: "승부욕 보이심", "이기시고 즐거워하심", "열심히 도전하심\""""

        if not time_flow_text:
            time_flow_text = """- "초반엔 망설이시다가 점차 자신감 있게 참여하심"
- "처음엔 어려워하셨으나 익숙해지시며 즐거워하심"
- "중반부터 피곤해하시며 속도 늦추심"
- "끝까지 집중력 유지하며 완성하심"
- "마지막에 다소 지치셨으나 만족스러워하심\""""

        return f"""당신은 요양원 프로그램 운영 기록 작성 전문가입니다.

# 신규 프로그램 정보
프로그램명: "{new_title}"

프로그램 설명:
{new_desc}

# 생성 목표
위 프로그램의 특성을 깊이 이해하고, 어르신들의 현실적이고 다양한 반응을 생성하세요.

# 감정 분포 (고정)
반응은 총 {count}개 생성하되, 아래 개수를 반드시 정확히 지키세요.
- 긍정: {positive_count}개
- 중립: {neutral_count}개
- 소극/피로: {negative_count}개

# 감정 표현 가이드

**긍정적 감정:**
{positive_emotions_text}

**중립적 감정:**
{neutral_emotions_text}

**소극적/피로 표현:**
{negative_emotions_text}

# 개인별 특성 반영 패턴
어르신의 다양한 특성을 자연스럽게 반영하세요:

**인지 수준별:**
{cognitive_text}

**신체 능력별:**
{physical_text}

**사회성별:**
{social_text}

# 프로그램 특성별 구체적 행동 표현
{program_behaviors_text}

# 시간 흐름 및 변화 표현
프로그램 진행에 따른 자연스러운 변화:
{time_flow_text}

# 실제 관찰 느낌의 표현
추상적 표현보다 구체적 관찰:
- ❌ "좋아하심" → ✅ "박수 치시며 '좋다'고 말씀하심"
- ❌ "열심히 함" → ✅ "땀 흘리시며 끝까지 집중하심"
- ❌ "즐거워함" → ✅ "환하게 웃으시며 다른 어르신과 이야기 나누심"
- ❌ "어려워함" → ✅ "고개 갸우뚱하시며 요양쌤에게 도움 요청하심"

# 출력 형식 (필수)
아래 3개 섹션으로 나누어 출력하세요. 각 섹션에는 해당 개수만큼만 숫자 리스트로 작성하세요.

[긍정]
1. ...
2. ...
(총 {positive_count}개)

[중립]
1. ...
2. ...
(총 {neutral_count}개)

[소극/피로]
1. ...
2. ...
(총 {negative_count}개)

# 작성 규칙
1. 존댓말 "~하심" 형태로 작성
2. **각 반응은 30자 이상 작성 (구체적 상황, 세부 동작, 표정 변화, 말씀 등 포함)**
3. 자연스럽고 실제 관찰한 듯한 표현 - 생동감과 현장감 최대화
4. 다양한 인지수준, 신체능력, 사회성이 골고루 분포
5. 프로그램 특성이 반영된 구체적 행동 (도구 사용, 재료 다루기, 신체 움직임 등)
6. 중복 표현 최소화 - 각 반응이 독특하고 차별화되게
7. **풍부한 디테일**: 어르신의 구체적 말씀, 표정 변화, 손동작, 다른 어르신과의 대화/상호작용
8. **감정 표현 다양화**: 같은 긍정이라도 "기쁨/흥미/만족/자랑스러움" 등 세분화
9. 섹션 제목([긍정], [중립], [소극/피로])은 반드시 포함
10. 섹션별 개수 불일치 시, 스스로 수정해서 맞춘 뒤 최종 출력
11. 다른 설명/서문 금지"""

    def generate_reactions(self):
        """AI로 반응 생성"""
        # 입력 검증
        api_key = self.api_key_var.get().strip()
        mode = self.mode_var.get()
        count = self.count_var.get()

        if not api_key:
            messagebox.showwarning("경고", "Gemini API 키를 입력해주세요.")
            return

        if count < 1 or count > 50:
            messagebox.showwarning("경고", "개수는 1~50 사이로 입력해주세요.")
            return

        # 모드별 검증 및 프롬프트 생성
        if mode == "existing":
            program_name = self.get_selected_program()
            if not program_name:
                messagebox.showwarning("경고", "프로그램을 선택해주세요.")
                return

            examples = self.get_example_reactions(program_name)
            if not examples:
                messagebox.showwarning("경고", "선택한 프로그램에 참고할 수 있는 반응이 없습니다.")
                return

            # 고도화된 프롬프트 생성
            prompt = self.build_advanced_prompt_existing(program_name, examples, count)

        else:  # new
            new_title = self.new_title_var.get().strip()
            new_desc = self.new_desc_text.get('1.0', tk.END).strip()

            if not new_title:
                messagebox.showwarning("경고", "신규 프로그램 제목을 입력해주세요.")
                return

            if not new_desc or new_desc.startswith("예시:"):
                messagebox.showwarning("경고", "프로그램 설명을 입력해주세요.")
                return

            # 고도화된 프롬프트 생성
            prompt = self.build_advanced_prompt_new(new_title, new_desc, count)
        
        # 저장 체크박스가 체크되어 있으면 설정 저장
        if self.save_key_var.get():
            self.save_config()
        
        selected_model_name = self.model_var.get()
        model_id = self.gemini_models[selected_model_name]
        
        # UI 업데이트
        self.generate_btn.config(state='disabled')
        self.progress_bar.start(10)
        
        if mode == "existing":
            self.progress_label.config(text=f"🤖 {selected_model_name}이(가) 기존 프로그램 반응을 생성 중...")
        else:
            self.progress_label.config(text=f"🤖 {selected_model_name}이(가) 신규 프로그램 반응을 생성 중...")
        
        # 타이머 시작
        self.generation_start_time = time.time()
        self.timer_running = True
        timer_thread = threading.Thread(target=self.update_timer, daemon=True)
        timer_thread.start()
        
        self.root.update()

        try:
            # Gemini API 호출
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"

            headers = {'Content-Type': 'application/json'}
            data = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 1.0,  # 높은 창의성과 다양성
                    "topK": 50,          # 더 넓은 선택 범위
                    "topP": 0.98,        # 누적 확률 높여 다양한 표현
                    "maxOutputTokens": 3072  # 더 긴 응답 허용
                }
            }

            response = requests.post(url, headers=headers, json=data, timeout=30)
            
            if response.status_code != 200:
                error_data = response.json()
                error_msg = error_data.get('error', {}).get('message', '알 수 없는 오류')
                raise Exception(f"API 오류: {error_msg}")
            
            # 응답 파싱
            result = response.json()
            generated_text, error = self.parse_api_response(result)
            
            if error:
                raise Exception(error)
            
            # 타이머 종료
            self.timer_running = False
            elapsed = time.time() - self.generation_start_time

            # 감정별 섹션 파싱
            positive_text, neutral_text, negative_text = self.parse_emotion_sections(generated_text)

            # 결과 표시 (3분할)
            self.positive_text.delete('1.0', tk.END)
            self.positive_text.insert('1.0', positive_text)

            self.neutral_text.delete('1.0', tk.END)
            self.neutral_text.insert('1.0', neutral_text)

            self.negative_text.delete('1.0', tk.END)
            self.negative_text.insert('1.0', negative_text)

            mode_text = "기존 프로그램" if mode == "existing" else "신규 프로그램"
            self.progress_label.config(text=f"✅ {mode_text} 반응 생성 완료! (모델: {selected_model_name})")
            self.timer_label.config(text=f"완료 시간: {elapsed:.1f}초")
            
        except requests.exceptions.Timeout:
            self.timer_running = False
            messagebox.showerror("오류", "요청 시간이 초과되었습니다.\n\n다시 시도해주세요.")
            self.progress_label.config(text="❌ 생성 실패 (시간 초과)")
            self.timer_label.config(text="")
        except Exception as e:
            self.timer_running = False
            error_message = str(e)
            
            if "안전 필터링" in error_message or "SAFETY" in error_message:
                messagebox.showerror(
                    "안전 필터링",
                    "AI가 안전 필터링으로 인해 생성을 거부했습니다.\n\n다시 시도해주세요."
                )
            else:
                messagebox.showerror("생성 오류", f"생성 중 오류 발생:\n\n{error_message}")
            
            self.progress_label.config(text="❌ 생성 실패")
            self.timer_label.config(text="")
        finally:
            self.progress_bar.stop()
            self.generate_btn.config(state='normal')
    
    def copy_to_clipboard(self):
        """결과를 클립보드에 복사"""
        positive = self.positive_text.get('1.0', tk.END).strip()
        neutral = self.neutral_text.get('1.0', tk.END).strip()
        negative = self.negative_text.get('1.0', tk.END).strip()

        # 전체 텍스트 조합
        full_text = ""
        if positive:
            full_text += "[긍정]\n" + positive + "\n\n"
        if neutral:
            full_text += "[중립]\n" + neutral + "\n\n"
        if negative:
            full_text += "[소극/피로]\n" + negative

        if full_text.strip():
            self.root.clipboard_clear()
            self.root.clipboard_append(full_text.strip())
            messagebox.showinfo("완료", "전체 내용이 클립보드에 복사되었습니다!")
        else:
            messagebox.showwarning("경고", "복사할 내용이 없습니다.")

def main():
    root = tk.Tk()
    
    # 스타일 설정
    style = ttk.Style()
    style.theme_use('clam')
    
    app = ReactionGeneratorApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
